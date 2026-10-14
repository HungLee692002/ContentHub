import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        This Privacy Policy explains what information {site.name} (the
        &quot;Service&quot;) collects and how it is used. The Service is a
        private tool built and operated by {site.owner} (&quot;the
        Owner&quot;) for the Owner&apos;s own channel. It is not offered to the
        public, so the only person whose data is processed is the Owner.
      </p>

      <section>
        <h2>1. Information the Service processes</h2>
        <ul>
          <li>
            <strong>Google account:</strong> name, email address and profile
            picture, used only to sign in and to verify that the signed-in
            account is the Owner&apos;s.
          </li>
          <li>
            <strong>TikTok account (when connected):</strong> profile
            information (display name, avatar), profile statistics such as
            follower and like counts, and the account&apos;s own video list
            with view, like, comment and share counts, according to the
            permissions the Owner approves.
          </li>
          <li>
            <strong>Content entered by the Owner:</strong> ideas, scripts,
            captions, hashtags, schedules and imported statistics files.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. How the information is used</h2>
        <ul>
          <li>To provide planning, scheduling and analytics features.</li>
          <li>To display performance statistics of the connected channel.</li>
          <li>
            To generate content suggestions. Text submitted for this purpose
            (such as a topic or channel description) is sent to a third-party
            AI provider to produce the result.
          </li>
        </ul>
        <p>
          The information is read-only with respect to TikTok unless the Owner
          explicitly requests an action. It is not sold, not used for
          advertising, and not used to build profiles of any other person.
        </p>
      </section>

      <section>
        <h2>3. Service providers</h2>
        <p>
          Data is processed by the providers needed to run the Service:
          website hosting, a database, file storage, an AI provider for
          suggestions, and Google and TikTok for sign-in and channel data.
          Information is disclosed otherwise only if required by law.
        </p>
      </section>

      <section>
        <h2>4. Storage and security</h2>
        <p>
          Data is stored with reputable cloud providers. Access tokens issued
          by TikTok or Google are stored encrypted and used only to perform
          requests made by the Owner. Access to the Service is restricted to
          the Owner&apos;s Google account.
        </p>
      </section>

      <section>
        <h2>5. Retention, revocation and deletion</h2>
        <ul>
          <li>
            Disconnecting TikTok in the Service deletes the stored TikTok
            tokens and the TikTok data obtained through them.
          </li>
          <li>
            Access can also be revoked at any time in TikTok (Settings and
            privacy → Security &amp; permissions → Manage app permissions) or
            in the Google Account permissions page.
          </li>
          <li>
            All stored data can be deleted on request; contact the address
            below.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Changes</h2>
        <p>
          This policy may be updated; the &quot;Last updated&quot; date above
          shows the latest version.
        </p>
      </section>

      <section>
        <h2>7. Contact</h2>
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
