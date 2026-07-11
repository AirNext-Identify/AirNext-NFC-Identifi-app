import { supabase } from "./supabase";

/**
 * Bucket onde as imagens são armazenadas.
 */
const BUCKET = "profile-media";

/**
 * Converte um DataURL (base64) em Blob.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");

  const mime =
    meta.match(/data:(.*);base64/)?.[1] || "image/jpeg";

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], {
    type: mime,
  });
}

/**
 * Faz upload de uma imagem para o Supabase Storage.
 */
export async function uploadProfileImage(
  input: string | File,
  userId: string,
  kind: string = "imagem"
): Promise<{ url: string | null; error?: string }> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return {
        url: null,
        error: "Usuário não autenticado.",
      };
    }

    const blob =
      typeof input === "string"
        ? dataUrlToBlob(input)
        : input;

    const ext = blob.type.includes("png") ? "png" : "jpg";

    const path = `${userId}/${kind}-${Date.now()}.${ext}`;

    const { error: uploadError } =
      await supabase.storage
        .from(BUCKET)
        .upload(path, blob, {
          contentType: blob.type,
          upsert: true,
        });

    if (uploadError) {
      return {
        url: null,
        error: uploadError.message,
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return {
      url: publicUrl,
    };
  } catch (err: any) {
    console.error(err);

    return {
      url: null,
      error: err?.message || "Erro ao enviar imagem.",
    };
  }
}