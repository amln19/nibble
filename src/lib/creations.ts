export type CreationRow = {
  id: string;
  user_id: string;
  title: string;
  details: string | null;
  image_url: string;
  author_label: string | null;
  created_at: string;
  is_public?: boolean;
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
  recipe_id?: string | null;
  recipe_title?: string | null;
};

export type CommentRow = {
  id: string;
  creation_id: string;
  user_id: string;
  author_label: string | null;
  comment_text: string;
  created_at: string;
};
