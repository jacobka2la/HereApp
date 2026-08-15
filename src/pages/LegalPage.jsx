import { Link, useLocation } from 'react-router-dom';

const UPDATED = 'August 15, 2026';

const sections = {
  '/terms': {
    title: 'Terms of Service',
    intro: 'These Terms govern your use of Here. By creating an account or using the app, you agree to these Terms.',
    items: [
      ['Eligibility', 'You must be able to legally use the service in your location. You are responsible for the information and activity associated with your account.'],
      ['Accounts', 'Keep your login information secure and provide accurate account information. We may suspend or remove accounts used for abuse, fraud, impersonation, harassment, or attempts to interfere with the app.'],
      ['Location and crowd information', 'Here shows user-submitted and automatically calculated venue activity. Crowd levels, lines, cover charges, comments, and check-ins may be incomplete, delayed, or inaccurate. Do not rely on Here for safety-critical decisions.'],
      ['User content', 'You remain responsible for content you submit. Do not post illegal, threatening, hateful, harassing, sexually exploitative, deceptive, or otherwise abusive content. Do not violate another person’s privacy or intellectual-property rights.'],
      ['Moderation', 'Here may remove content, limit features, suspend accounts, or ban users when reasonably necessary to protect users, enforce these Terms, or comply with law.'],
      ['No guarantee', 'The service is provided on an “as available” basis. Features may change, be interrupted, or be discontinued.'],
      ['Account deletion', 'You can initiate permanent account deletion from Profile inside Here. Deletion is intended to remove your account and associated personal data that we are not legally required to retain.'],
      ['Changes', 'We may update these Terms as the app changes. Material updates will be reflected by an updated effective date. Continued use after an update means you accept the revised Terms.'],
    ],
  },
  '/privacy': {
    title: 'Privacy Policy',
    intro: 'This policy explains what Here collects, why it is used, and the choices available to you.',
    items: [
      ['Information you provide', 'Here may collect your email address, username, account credentials through our authentication provider, check-ins, venue activity reports, comments, reactions, friend connections, reports, and other information you choose to submit.'],
      ['How we use information', 'We use information to operate accounts, show real-time venue activity, provide social features, prevent abuse, enforce community rules, maintain security, troubleshoot the service, and improve Here.'],
      ['Public information', 'Your username and user-generated activity that is designed to be social may be visible to other users. Your email address is not intended to be publicly displayed.'],
      ['Service providers', 'Here uses third-party infrastructure such as Firebase to provide authentication, database, and related backend services. These providers may process data as needed to provide their services.'],
      ['Retention', 'Live venue activity may reset on a nightly basis, while personal history and account statistics may remain associated with your account until deleted. Some limited records may be retained where reasonably necessary for security, fraud prevention, dispute resolution, or legal obligations.'],
      ['Deletion and choices', 'You can initiate account deletion from Profile inside Here. You may also stop using social features, log out, or decline device permissions where those permissions are optional.'],
      ['Security', 'We use reasonable technical and organizational safeguards, but no internet service can guarantee absolute security.'],
      ['Children', 'Here is not intended for children who are below the minimum age permitted to use the service in their jurisdiction.'],
      ['Policy changes', 'We may update this policy as Here changes. The effective date will be updated when we make changes.'],
    ],
  },
  '/community-rules': {
    title: 'Community Rules',
    intro: 'Here is built around real people sharing what is happening at venues right now. Keep it useful and do not make the app unsafe for other users.',
    items: [
      ['Zero tolerance for abuse', 'Do not harass, threaten, bully, stalk, intimidate, or target other users. Hate speech and attacks based on protected characteristics are not allowed.'],
      ['No objectionable or exploitative content', 'Do not post sexual exploitation, graphic violence, illegal content, or content that encourages dangerous or criminal behavior.'],
      ['Be accurate', 'Do not intentionally submit fake check-ins, fake cover charges, fake line reports, misleading venue activity, scams, or impersonations.'],
      ['Respect privacy', 'Do not publish private personal information about another person without permission.'],
      ['Report problems', 'Use the report tools when you see abusive or objectionable content. You can also block users when that option is available.'],
      ['Enforcement', 'Violating content may be removed and accounts may be limited, suspended, or permanently banned. Serious threats or unlawful conduct may be reported to appropriate authorities when required or appropriate.'],
    ],
  },
  '/support': {
    title: 'Support & Safety',
    intro: 'Use the in-app controls first whenever possible. For account or safety issues, this page explains the available options.',
    items: [
      ['Report content', 'Use the report option on user-generated content to flag abuse or objectionable material for review.'],
      ['Block users', 'Use the block feature when you do not want to interact with another user.'],
      ['Delete your account', 'Open Profile and choose Delete Account to initiate permanent deletion. If Firebase requires a recent login, log out, sign back in, and try again.'],
      ['Privacy requests', 'Account deletion is available directly inside the app. Additional privacy choices may be added here as the service expands.'],
      ['App review', 'Here’s backend services must remain available for account login and app functionality.'],
    ],
  },
};

export default function LegalPage() {
  const { pathname } = useLocation();
  const page = sections[pathname] || sections['/terms'];

  return (
    <div className="auth-shell" style={{ alignItems: 'flex-start', paddingTop: '24px', paddingBottom: '40px' }}>
      <section className="auth-panel" style={{ maxWidth: '760px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
          <img src="/logo-full.png" alt="Here" style={{ width: '110px', height: 'auto' }} />
          <Link to="/auth" style={{ color: '#78ffaa', fontWeight: 800, textDecoration: 'none' }}>Done</Link>
        </div>

        <h1 style={{ marginBottom: '6px' }}>{page.title}</h1>
        <p style={{ color: 'rgba(235,255,240,0.7)', marginTop: 0 }}>Effective {UPDATED}</p>
        <p style={{ lineHeight: 1.65 }}>{page.intro}</p>

        <div style={{ display: 'grid', gap: '18px', marginTop: '24px' }}>
          {page.items.map(([heading, body]) => (
            <section key={heading}>
              <h2 style={{ fontSize: '1.08rem', marginBottom: '6px' }}>{heading}</h2>
              <p style={{ margin: 0, lineHeight: 1.65, color: 'rgba(235,255,240,0.84)' }}>{body}</p>
            </section>
          ))}
        </div>

        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(120,255,170,0.12)' }}>
          <Link to="/terms" style={{ color: '#78ffaa' }}>Terms</Link>
          <Link to="/privacy" style={{ color: '#78ffaa' }}>Privacy</Link>
          <Link to="/community-rules" style={{ color: '#78ffaa' }}>Community Rules</Link>
          <Link to="/support" style={{ color: '#78ffaa' }}>Support</Link>
        </nav>
      </section>
    </div>
  );
}
