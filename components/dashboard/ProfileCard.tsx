"use client";

import Image from "next/image";
import { useState } from "react";
import { ProfileSettingsForm } from "@/components/dashboard/ProfileSettingsForm";
import type { UserProfile } from "@/types";

type ProfileCardProps = {
  profile: UserProfile;
};

export function ProfileCard({ profile }: ProfileCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const displayName = profile.displayName || profile.email.split("@")[0];

  return (
    <>
      <section className="panel profile-card">
        <div className="profile-card-header">
          <div className={`profile-card-avatar${profile.avatarUrl ? "" : " profile-card-avatar-fallback"}`}>
            {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill sizes="72px" /> : null}
          </div>
          <div className="profile-card-copy">
            <div className="section-eyebrow">Current profile</div>
            <h2>{displayName}</h2>
            <p className="field-help">{profile.email}</p>
          </div>
        </div>
        <div className="inline-actions">
          <button type="button" className="primary-button" onClick={() => setIsOpen(true)}>
            Edit Profile
          </button>
        </div>
      </section>

      {isOpen ? (
        <div className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
          <div className="profile-modal-backdrop" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="panel profile-modal-surface">
            <div className="profile-modal-header">
              <div>
                <div className="section-eyebrow">Profile settings</div>
                <h2 id="profile-modal-title">Edit profile</h2>
              </div>
              <button type="button" className="ghost-button" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>
            <ProfileSettingsForm profile={profile} onSaved={() => setIsOpen(false)} onCancel={() => setIsOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
