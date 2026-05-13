import { db } from "./admin";

/** Reference to a user's bookmarks subcollection. */
export function userBookmarksRef(userId: string) {
  return db.collection("bookmarks").doc(userId).collection("articles");
}

/** Reference to a single bookmark document. */
export function bookmarkDocRef(userId: string, slug: string) {
  return userBookmarksRef(userId).doc(slug);
}

/** Fetch all bookmark slugs for a user, ordered by savedAt desc. */
export async function getUserBookmarkSlugs(userId: string): Promise<string[]> {
  const snapshot = await userBookmarksRef(userId)
    .orderBy("savedAt", "desc")
    .get();
  return snapshot.docs.map((d) => d.id);
}
