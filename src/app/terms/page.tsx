import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p>
        These Terms of Service (&quot;Terms&quot;) apply to {site.name} (the
        &quot;Service&quot;), a private tool built and operated by{" "}
        {site.owner} (&quot;the Owner&quot;).
      </p>

      <section>
        <h2>1. What the Service is</h2>
        <p>
          The Service is a personal content management tool used by the Owner
          to manage the Owner&apos;s own short-form video channel. It helps
          organize video ideas and scripts, plan a content calendar, view
          performance statistics of the Owner&apos;s own channel, and receive
          AI-generated content suggestions. Where the Owner chooses to connect
          a TikTok account, the Service reads that account&apos;s profile and
          video information.
        </p>
      </section>

      <section>
        <h2>2. Private, restricted access</h2>
        <ul>
          <li>
            The Service is <strong>not offered to the public</strong>. Access is
            limited to the Owner&apos;s own Google account; no other accounts
            are registered or permitted.
          </li>
          <li>
            The Service only accesses data belonging to the account that the
            Owner has personally connected and authorized.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Third-party platforms</h2>
        <p>
          Use of TikTok and Google through the Service is also subject to
          TikTok&apos;s Terms of Service and Community Guidelines and
          Google&apos;s Terms of Service. The Service acts only with the
          Owner&apos;s explicit authorization, which can be revoked at any time
          from the TikTok or Google account settings or from within the
          Service. The Service never posts content to a connected account
          without the Owner&apos;s explicit confirmation.
        </p>
      </section>

      <section>
        <h2>4. AI-generated suggestions</h2>
        <p>
          The Service may use third-party AI models to generate ideas, scripts,
          captions and hashtags. Suggestions may be inaccurate and are reviewed
          by the Owner before any use. Fitness-related suggestions are for
          general content purposes only and are not medical or professional
          advice.
        </p>
      </section>

      <section>
        <h2>5. Acceptable use</h2>
        <p>
          The Service is used only in compliance with applicable law and the
          rules of the platforms it connects to. It is not used to spam,
          mislead, scrape data belonging to other people, or access accounts
          the Owner does not control.
        </p>
      </section>

      <section>
        <h2>6. Availability and liability</h2>
        <p>
          The Service is provided &quot;as is&quot; without warranties. The
          Owner may change, suspend or discontinue it at any time, and is not
          liable for losses arising from its use to the maximum extent
          permitted by law.
        </p>
      </section>

      <section>
        <h2>7. Changes</h2>
        <p>
          These Terms may be updated; the &quot;Last updated&quot; date above
          shows the latest version.
        </p>
      </section>

      <section>
        <h2>8. Contact</h2>
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
