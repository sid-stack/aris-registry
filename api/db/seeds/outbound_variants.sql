-- Optional manual seed (API auto-seeds empty `ab_variants` on first Apollo pull).
-- psql $DATABASE_URL -f api/db/seeds/outbound_variants.sql

INSERT INTO ab_variants (test_name, variant_key, subject, body_template) VALUES
('subject_v1', 'A',
 '{{company}} + SAM.gov bids',
 'Hi {{firstName}},

Saw {{company}} is active in government contracting. {{signal}}

Most BD teams your size spend 4–6 hours qualifying each opportunity manually.
BidSmith gives you bid/no-bid + full compliance matrix in 60 seconds.

Free to try: bidsmith.pro/free-audit — no demo, no credit card.

Worth a look?

Sid
Founder, ARIS Labs | bidsmith.pro'),
('subject_v1', 'B',
 'How long does {{company}} spend per RFP?',
 'Hi {{firstName}},

{{signal}} — figured bid qualification was on your radar.

We built BidSmith for BD teams that are reviewing too many opportunities manually.
Paste a SAM.gov link, get bid/no-bid + compliance matrix in 60 seconds.

No demo. No onboarding. Free: bidsmith.pro/free-audit

Sid
Founder, ARIS Labs | bidsmith.pro'),
('subject_v1', 'C',
 'Compliance matrix for {{company}} bids',
 'Hi {{firstName}},

Quick one — {{signal}}.

BidSmith auto-generates your compliance matrix from any SAM.gov link in under a minute.
The firms we work with cut RFP qualification time by 80%.

Try it free: bidsmith.pro/free-audit

Sid | BidSmith')
ON CONFLICT (test_name, variant_key) DO NOTHING;

INSERT INTO ab_variants (test_name, variant_key, subject, body_template) VALUES
('cta_v1', 'A',
 '{{company}} + government bids',
 'Hi {{firstName}},

{{signal}}

BidSmith turns any SAM.gov link into a bid/no-bid decision + compliance matrix in 60 seconds.
Built for teams like yours — no enterprise contract, no demo required.

Worth 60 seconds? bidsmith.pro/free-audit

Sid'),
('cta_v1', 'B',
 '{{company}} + government bids',
 'Hi {{firstName}},

{{signal}}

Can I show you BidSmith on one of your current opportunities?
Takes 5 minutes — you share a SAM.gov link, I run it live.

Free either way. Calendar: [CALENDLY_LINK]

Sid')
ON CONFLICT (test_name, variant_key) DO NOTHING;
