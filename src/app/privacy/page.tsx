import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        This Privacy Policy explains what information {site.name} (the
        &quot;Service&quot;) collects, how it is used, and the choices you
        have.
      </p>

      <section>
        <h2>1. Information we collect</h2>
        <ul>
          <li>
            <strong>Google account:</strong> your name, email address and
            profile picture, used only to sign you in.
          </li>
          <li>
            <strong>TikTok account (only if you connect it):</strong> your
            profile information (display name, avatar), public profile
            statistics, and your own video list with view, like, comment and
            share counts, based on the permissions you approve.
          </li>
          <li>
            <strong>Content you enter:</strong> ideas, scripts, captions,
            hashtags, schedules and statistics files you import.
          </li>
          <li>
            <strong>Videos you upload</strong> to the Service, if you use the
            upload or publishing features.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. How we use information</h2>
        <ul>
          <li>To provide the planning, scheduling and analytics features.</li>
          <li>To show performance statistics of your own channel.</li>
          <li>
            To upload or publish videos to your TikTok account, only when you
            explicitly request it.
          </li>
          <li>
            To generate content suggestions. The text you submit for this
            purpose (for example a topic or channel description) is sent to a
            third-party AI provider to produce the result.
          </li>
        </ul>
        <p>
          We do not sell your personal information and do not use it for
          advertising.
        </p>
      </section>

      <section>
        <h2>3. Sharing</h2>
        <p>
          We share data only with service providers needed to run the Service:
          hosting and database providers, file storage, an AI provider for
          suggestions, and the platforms you connect (such as TikTok) when you
          instruct us to act on them. We may disclose information if required
          by law.
        </p>
      </section>

      <section>
        <h2>4. Storage and security</h2>
        <p>
          Data is stored with reputable cloud providers. Access tokens issued
          by TikTok or Google are stored encrypted and used only to perform
          actions you requested. No method of transmission or storage is
          completely secure, but we take reasonable measures to protect your
          data.
        </p>
      </section>

      <section>
        <h2>5. Retention and deletion</h2>
        <p>
          We keep your data while your account is active. You can disconnect
          TikTok at any time, which deletes the stored tokens and TikTok data
          obtained through it. You can also request deletion of all your data
          by emailing us at the address below.
        </p>
      </section>

      <section>
        <h2>6. Your choices</h2>
        <ul>
          <li>
            Revoke access to this Service from your TikTok settings (Settings
            and privacy → Security &amp; permissions → Manage app permissions)
            or your Google Account permissions page.
          </li>
          <li>Access, correct or delete your data on request.</li>
        </ul>
      </section>

      <section>
        <h2>7. Children</h2>
        <p>
          The Service is not directed to children under 13 and we do not
          knowingly collect their information.
        </p>
      </section>

      <section>
        <h2>8. Changes</h2>
        <p>
          We may update this policy; the &quot;Last updated&quot; date shows the
          latest version.
        </p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>
          Privacy questions or requests:{" "}
          <a className="underline" href={`mailto:${site.contactEmail}`}>
            {site.contactEmail}
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
