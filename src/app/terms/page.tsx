import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of{" "}
        {site.name} (the &quot;Service&quot;). By using the Service you agree
        to these Terms.
      </p>

      <section>
        <h2>1. The Service</h2>
        <p>
          {site.name} is a content planning tool for creators. It lets you
          organize video ideas and scripts, schedule content, view performance
          statistics of your own channel, and receive AI-generated content
          suggestions. Where you choose to connect your TikTok account, the
          Service may also read your own profile and video information and help
          you upload or publish your own videos.
        </p>
      </section>

      <section>
        <h2>2. Accounts and access</h2>
        <ul>
          <li>You sign in with your Google account.</li>
          <li>
            You are responsible for activity under your account and for keeping
            your credentials secure.
          </li>
          <li>
            You must be old enough to use the connected platforms under their
            own rules.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Connected third-party platforms</h2>
        <p>
          When you connect your TikTok account, you also agree to be bound by
          TikTok&apos;s Terms of Service and Community Guidelines. The Service
          only acts on your behalf with your explicit authorization, and you
          can revoke that authorization at any time from your TikTok settings
          or from within the Service.
        </p>
      </section>

      <section>
        <h2>4. Your content</h2>
        <p>
          You retain all rights to the content you create, upload or schedule.
          You are solely responsible for your content and for ensuring it
          complies with applicable law, the rights of others, and the rules of
          the platforms you publish to. The Service will never publish content
          to your account without your explicit confirmation.
        </p>
      </section>

      <section>
        <h2>5. AI-generated suggestions</h2>
        <p>
          The Service may use third-party AI models to generate ideas, scripts,
          captions and hashtags. Suggestions may be inaccurate or unsuitable;
          you are responsible for reviewing them before use. Fitness-related
          suggestions are for general content purposes only and are not medical
          or professional advice.
        </p>
      </section>

      <section>
        <h2>6. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>use the Service for unlawful, misleading or abusive activity;</li>
          <li>attempt to disrupt or gain unauthorized access to the Service;</li>
          <li>
            use the Service to violate the terms of TikTok or any other
            connected platform.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Availability and changes</h2>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;
          without warranties of any kind. We may modify, suspend or discontinue
          any part of the Service at any time and may update these Terms; the
          &quot;Last updated&quot; date above shows the latest version.
        </p>
      </section>

      <section>
        <h2>8. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, we are not liable for any
          indirect or consequential damages, or for loss of data, revenue or
          account standing on third-party platforms arising from your use of
          the Service.
        </p>
      </section>

      <section>
        <h2>9. Termination</h2>
        <p>
          You may stop using the Service and request deletion of your data at
          any time. We may suspend access if these Terms are violated.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a className="underline" href={`mailto:${site.contactEmail}`}>
            {site.contactEmail}
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
