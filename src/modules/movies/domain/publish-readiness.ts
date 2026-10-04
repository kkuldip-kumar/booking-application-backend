import { EntityManager } from 'typeorm';

interface ReadinessRow {
  has_poster: boolean;
  has_genre: boolean;
  has_audio_language: boolean;
}

const READINESS_SQL = `
  SELECT
    EXISTS (SELECT 1 FROM movie_assets WHERE movie_id = $1 AND asset_type = 'POSTER') AS has_poster,
    EXISTS (SELECT 1 FROM movie_genres WHERE movie_id = $1) AS has_genre,
    EXISTS (SELECT 1 FROM movie_languages WHERE movie_id = $1 AND language_type = 'AUDIO') AS has_audio_language
`;

export async function findPublishBlockers(manager: EntityManager, movieId: string): Promise<string[]> {
  const rows: ReadinessRow[] = await manager.query(READINESS_SQL, [movieId]);
  const row = rows[0];
  const blockers: string[] = [];
  if (!row?.has_poster) blockers.push('poster image');
  if (!row?.has_genre) blockers.push('at least one genre');
  if (!row?.has_audio_language) blockers.push('at least one audio language');
  return blockers;
}
