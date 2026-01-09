import { NextResponse } from "next/server";
import { requireAuth, fetchClerkUser } from "@/lib/server/auth";
import { loadStore, saveStore } from "@/lib/server/store";
import type { UserProfile } from "@/lib/api/types";
import { badRequest, respondWithError } from "@/lib/server/apiErrors";

export const runtime = "nodejs";

const buildProfileFromClerk = async (userId: string): Promise<UserProfile> => {
  const user = await fetchClerkUser(userId);
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  );
  const primaryPhone = user.phoneNumbers.find(
    (phone) => phone.id === user.primaryPhoneNumberId
  );

  return {
    id: user.id,
    name: fullName || primaryPhone?.phoneNumber || user.username || user.id,
    email: primaryEmail?.emailAddress,
    avatarUrl: user.imageUrl
  };
};

const getStoredProfile = async (userId: string) => {
  const store = await loadStore();
  const existing = store.users[userId];
  if (existing) {
    return { store, profile: existing };
  }

  const profile = await buildProfileFromClerk(userId);
  store.users[userId] = profile;
  await saveStore(store);
  return { store, profile };
};

export async function GET(request: Request) {
  try {
    const { userId } = await requireAuth(request);
    const { profile } = await getStoredProfile(userId);
    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await requireAuth(request);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      throw badRequest("Invalid request body.");
    }

    const { store, profile } = await getStoredProfile(userId);
    const nextProfile: UserProfile = {
      ...profile,
      name: typeof body.name === "string" ? body.name : profile.name,
      email: typeof body.email === "string" ? body.email : profile.email,
      avatarUrl:
        typeof body.avatarUrl === "string" ? body.avatarUrl : profile.avatarUrl
    };

    store.users[userId] = nextProfile;
    await saveStore(store);

    return NextResponse.json(nextProfile, { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}
