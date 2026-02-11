export interface ReviewMeta {
  reviewed: boolean;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export function getReviewMeta(data: Record<string, unknown>): ReviewMeta {
  const reviewedByRaw = (data as Record<string, unknown>)?.reviewed_by;
  const reviewedAtRaw = (data as Record<string, unknown>)?.reviewed_at;

  const reviewedBy = reviewedByRaw ? String(reviewedByRaw) : null;
  let reviewedAt: string | null = null;

  if (reviewedAtRaw) {
    const date = new Date(String(reviewedAtRaw));
    if (!Number.isNaN(date.getTime())) {
      reviewedAt = date.toISOString().slice(0, 10);
    }
  }

  const reviewed = Boolean(reviewedBy) && Boolean(reviewedAt);

  return { reviewed, reviewedAt, reviewedBy };
}

export function getReviewStatus(data: Record<string, unknown>): 'reviewed' | 'unreviewed' {
  return getReviewMeta(data).reviewed ? 'reviewed' : 'unreviewed';
}
