import { NextResponse } from "next/server";
import { normalizeForTts } from "@/lib/gordon/tts-format";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

let cachedVoiceId: string | null = null;

async function resolveVoiceId(apiKey: string): Promise<string | null> {
  const explicit = process.env.ELEVENLABS_VOICE_ID;
  if (explicit) return explicit;
  if (cachedVoiceId) return cachedVoiceId;

  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      voices?: { voice_id: string; name: string; category?: string }[];
    };

    const voices = data.voices ?? [];
    const premade = voices.find((v) => v.category === "premade");
    const pick = premade ?? voices[0];
    if (pick) {
      cachedVoiceId = pick.voice_id;
      console.log(`ElevenLabs: using voice "${pick.name}" (${pick.voice_id})`);
      return cachedVoiceId;
    }
  } catch (e) {
    console.warn("Failed to fetch ElevenLabs voices:", e);
  }
  return null;
}

async function synthesize(
  apiKey: string,
  voiceId: string,
  speechText: string,
): Promise<Response> {
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: speechText,
      model_id: "eleven_turbo_v2_5",
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.8,
        style: 0.35,
        use_speaker_boost: true,
      },
    }),
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`gordon:speak:${user.id}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many TTS requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text?.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }
    if (text.trim().length > 1_000) {
      return NextResponse.json({ error: "Text is too long" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs not configured" },
        { status: 503 },
      );
    }

    const voiceId = await resolveVoiceId(apiKey);
    if (!voiceId) {
      return NextResponse.json(
        {
          error:
            "No voices available — add a voice in your ElevenLabs dashboard",
        },
        { status: 503 },
      );
    }

    const speechText = normalizeForTts(text).slice(0, 1000);
    let res = await synthesize(apiKey, voiceId, speechText);

    if (res.status === 402 || res.status === 403) {
      console.warn(
        `ElevenLabs: voice ${voiceId} rejected (${res.status}), clearing cache and retrying...`,
      );
      cachedVoiceId = null;
      const fallbackId = await resolveVoiceId(apiKey);
      if (fallbackId && fallbackId !== voiceId) {
        res = await synthesize(apiKey, fallbackId, speechText);
      }
    }

    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      console.error("ElevenLabs error:", res.status, err);
      return NextResponse.json(
        { error: "TTS generation failed" },
        { status: 502 },
      );
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("Gordon speak error:", e);
    return NextResponse.json({ error: "TTS request failed" }, { status: 500 });
  }
}
