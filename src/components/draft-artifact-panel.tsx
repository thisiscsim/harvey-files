"use client";

import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SvgIcon } from "@/components/svg-icon";
import DraftDocumentToolbar from "@/components/draft-document-toolbar";
import ShareArtifactDialog from "@/components/share-artifact-dialog";
import ExportReviewDialog from "@/components/export-review-dialog";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { TrackChangeExtension } from '@/lib/track-changes';

interface DraftArtifactPanelProps {
  selectedArtifact: { title: string; subtitle: string } | null;
  isEditingArtifactTitle: boolean;
  editedArtifactTitle: string;
  onEditedArtifactTitleChange: (value: string) => void;
  onStartEditingTitle: () => void;
  onSaveTitle: () => void;
  onClose: () => void;
  chatOpen: boolean;
  onToggleChat: (open: boolean) => void;
  shareArtifactDialogOpen: boolean;
  onShareArtifactDialogOpenChange: (open: boolean) => void;
  exportReviewDialogOpen: boolean;
  onExportReviewDialogOpenChange: (open: boolean) => void;
  artifactTitleInputRef: React.RefObject<HTMLInputElement | null>;
  sourcesDrawerOpen?: boolean;
  onSourcesDrawerOpenChange?: (open: boolean) => void;
  contentType?: 's1-shell' | 'memorandum' | 'response-memo' | 'side-letter';
}

// S-1 Shell content
const S1_SHELL_CONTENT = `
  <h2>United States</h2>
  <p>Securities and Exchange Commission</p>
  <p>Washington, D.C. 20549</p>
  <hr/>
  <h2>Form S-1</h2>
  <p>Registration Statement under the Securities Act of 1933</p>
  <hr/>
  <p>Valar AI, Inc.<br/>
  Delaware Corporation<br/>
  9872398729</p>
  <p>1234 Main Street, Suite 2900<br/>
  San Francisco, CA 94105<br/>
  123-456-7890</p>
  <p>Prescott & Wainwright LLP<br/>
  535 Mission St<br/>
  San Francisco, CA 94105<br/>
  628-432-5100</p>
  <hr/>
  <p><strong>Approximate date of commencement of proposed sale of the securities to the public:</strong> As soon as practicable after the effective date of this registration statement.</p>
  <p>If any of the securities being registered on this Form are to be offered on a delayed or continuous basis pursuant to Rule 415 under the Securities Act of 1933, check the following box</p>
  <p>If this Form is filed to register additional securities for an offering pursuant to Rule 462(b) under the Securities Act, please check the following box and list the Securities Act registration statement number of the earlier effective registration statement for the same offering.</p>
  <p>If this Form is a post-effective amendment filed pursuant to Rule 462(c) under the Securities Act, check the following box and list the Securities Act registration statement number of the earlier effective registration statement for the same offering.</p>
  <p>If this Form is a post-effective amendment filed pursuant to Rule 462(d) under the Securities Act, check the following box and list the Securities Act registration statement number of the earlier effective registration statement for the same offering.</p>
  <p>Indicate by check mark whether the registrant is a large accelerated filer, an accelerated filer, a non-accelerated filer, smaller reporting company, or an emerging growth company. See the definitions of "large accelerated filer," "accelerated filer," "smaller reporting company," and "emerging growth company" in Rule 12b-2 of the Exchange Act.</p>
  <p>Large accelerated filer ☐ Accelerated filer ☐ Non-accelerated filer ☐ Smaller reporting company ☐ Emerging growth company ☐</p>
`;

// Draft Memorandum content
const MEMORANDUM_CONTENT = `
  <h2>Draft Memorandum</h2>
  <p><strong>TO:</strong> Board of Directors and Executive Leadership Team<br/>
  <strong>FROM:</strong> Legal & Compliance Department<br/>
  <strong>DATE:</strong> January 26, 2026<br/>
  <strong>RE:</strong> Key Compliance Obligations for Q2 2026 Initial Public Offering</p>
  <hr/>
  <h2>Executive Summary</h2>
  <p>This memorandum outlines the primary compliance obligations and regulatory requirements that our company must satisfy in connection with our planned initial public offering in Q2 2026. As a mid-cap company transitioning to public company status, we will become subject to extensive securities laws, reporting requirements, and corporate governance standards.</p>
  <h2>I. Securities Registration and Disclosure</h2>
  <p><strong>SEC Registration Statement (Form S-1)</strong><br/>
  We must file a comprehensive registration statement with the Securities and Exchange Commission that includes our prospectus. This document requires extensive disclosure regarding our business operations, financial condition, risk factors, management discussion and analysis, and audited financial statements for the past three fiscal years.</p>
  <p><strong>Prospectus Requirements</strong><br/>
  The prospectus must provide full and fair disclosure of all material information that would be important to a reasonable investor. This includes detailed descriptions of our business model, competitive landscape, litigation matters, executive compensation, related party transactions, and use of proceeds.</p>
  <h2>II. Financial Reporting and Auditing</h2>
  <p><strong>Audited Financial Statements</strong><br/>
  We must provide audited financial statements prepared in accordance with Generally Accepted Accounting Principles (GAAP) and audited by a registered public accounting firm under PCAOB standards.</p>
  <p><strong>Internal Controls - Sarbanes-Oxley Act Section 404</strong><br/>
  Management must establish and document effective internal controls over financial reporting. While mid-cap filers may receive some transition relief, we must begin compliance planning immediately. Annual management assessment of internal controls will be required, with eventual auditor attestation.</p>
  <p><strong>Ongoing Periodic Reporting</strong><br/>
  Post-IPO, we will be required to file:</p>
  <ul>
    <li>Quarterly Reports (Form 10-Q) within 40 days of quarter-end</li>
    <li>Annual Reports (Form 10-K) within 60 days of fiscal year-end</li>
    <li>Current Reports (Form 8-K) for material events within 4 business days</li>
  </ul>
  <h2>III. Corporate Governance Requirements</h2>
  <p><strong>Board Composition and Independence</strong><br/>
  We must establish a board of directors with a majority of independent directors as defined under applicable stock exchange listing standards. The audit committee must be composed entirely of independent directors, with at least one financial expert.</p>
`;

const RESPONSE_MEMO_CONTENT = `
  <p style="text-align: center"><strong>PRIVILEGED &amp; CONFIDENTIAL — ATTORNEY WORK PRODUCT</strong></p>
  <hr/>
  <h2>MEMORANDUM</h2>
  <p><strong>To:</strong> Crestonridge Equity Advisors LLC<br/>
  <strong>From:</strong> Whitfield &amp; Crane LLP<br/>
  <strong>Date:</strong> February 17, 2026<br/>
  <strong>Re:</strong> Response to LPA Comment Letter — Umber Public Pension System ("UmberPension")<br/>
  Crestonridge Equity Partners Fund V, L.P.</p>
  <hr/>
  <h2>Overview</h2>
  <p>This memorandum responds to the comment letter submitted by Ashford Keene LLP on behalf of UmberPension, dated February 8, 2026, with respect to the draft Limited Partnership Agreement of Crestonridge Equity Partners Fund V, L.P. (the "Fund"). UmberPension has submitted a proposed commitment of <strong>$200,000,000</strong>, placing it in <strong>MFN Tier 1</strong> (Full MFN election rights).</p>
  <p>The comment letter contains <strong>67 discrete comments</strong> spanning 14 sections of the draft LPA. Our recommended dispositions are summarized below and detailed in the section-by-section response that follows.</p>
  <h3>Disposition Summary</h3>
  <table>
    <tr><th>Category</th><th>Count</th><th>%</th></tr>
    <tr><td>Agree — Consistent with Precedent</td><td>42</td><td>63%</td></tr>
    <tr><td>Agree with Modification</td><td>12</td><td>18%</td></tr>
    <tr><td>Decline — Against Precedent</td><td>9</td><td>13%</td></tr>
    <tr><td>Flag for Review — Novel Request</td><td>4</td><td>6%</td></tr>
    <tr><td><strong>Total</strong></td><td><strong>67</strong></td><td><strong>100%</strong></td></tr>
  </table>
  <h3>Key Comments & Responses</h3>
  <table>
    <tr><th>LPA Section</th><th>LP Comment</th><th>GP Response</th><th>Disposition</th></tr>
    <tr><td>Section 5.2, "Distributions"</td><td>Please increase the management fee step-down upon entering the harvest period from 0.25% to 0.50% of committed capital, consistent with market standard.</td><td>Thank you. The current step-down structure was negotiated with our anchor LPs early in the fundraise and is consistent across all limited partners. Reopening the fee terms at this stage would require us to revisit commitments already made to other investors, which we're not able to do.</td><td>Decline — against Fund IV precedent</td></tr>
    <tr><td>Section 7.1, "Key Person"</td><td>The current key person trigger requires three of five named individuals to leave before the provision is activated. We'd like this reduced to two of five, given that the loss of any two senior members would materially impact the fund's investment strategy.</td><td>We cannot make this change. The three-of-five threshold was deliberately set to avoid unnecessary fund suspensions from normal senior-level attrition. We're confident the current language appropriately balances LP protection with operational continuity.</td><td>Decline — against Fund IV precedent</td></tr>
    <tr><td>Section 9, "Excuse Rights"</td><td>The LPA does not include a provision allowing LPs to be excused from co-investments that conflict with their internal investment policies. We'd like standard excuse language added before signing.</td><td>We're happy to add a narrowly drafted excuse right covering regulatory or policy conflicts.</td><td>Agree — consistent with Fund IV precedent</td></tr>
    <tr><td>Section 11.4, "LP Advisory Committee Consent"</td><td>Please require unanimous consent from the LPAC, rather than a simple majority, for conflicts of interest and fee-related amendments.</td><td>We are willing to move to a supermajority threshold of 75% of the LPAC.</td><td>Agree with modification</td></tr>
  </table>
  <hr/>
  <h2>Section 3.1 — Management Fee</h2>
  <h3>Comment 3.1(a) — Fee Rate and Step-Down</h3>
  <p><strong>LP Comment:</strong><br/>
  UmberPension requests that the Management Fee be reduced from 2.0% to 1.5% of Committed Capital during the Investment Period, and to 1.5% of Invested Capital (at cost) following the expiration of the Investment Period.</p>
  <p><strong>Disposition:</strong> Agree with Modification</p>
  <p><strong>Recommended Response:</strong><br/>
  We recommend agreeing to a step-down to 1.75% of Invested Capital (at cost) following the expiration of the Investment Period, but maintaining the 2.0% rate during the Investment Period.</p>
  <p>The post-IP step-down to 1.75% on Invested Capital is consistent with the term granted to UmberPension in Fund IV (Side Letter 2(a)). The request to reduce the Investment Period rate to 1.5% was declined in Fund IV and we recommend the same position here. A rate of 2.0% during the Investment Period has been the GP's baseline across Fund III, Fund IV, and the current draft, and no market shift warrants a departure.</p>
  <p><strong>Fund IV Precedent:</strong> Side Letter 2(a) — Agreed to 1.75% post-IP on Invested Capital. IP-period reduction to 1.5% was declined.</p>
  <p><strong>Suggested Redline:</strong> Section 3.1(b) — following the expiration of the Investment Period, strike "2.0% of Committed Capital" and replace with "1.75% of Invested Capital (at cost)."</p>
  <hr/>
  <h3>Comment 3.1(b) — Fee Offset</h3>
  <p><strong>LP Comment:</strong><br/>
  UmberPension requests a 100% offset against the Management Fee for all transaction fees, monitoring fees, directors' fees, advisory fees, and any other fees received by the General Partner or its Affiliates from Portfolio Companies.</p>
  <p><strong>Disposition:</strong> Agree with Modification</p>
  <p><strong>Recommended Response:</strong><br/>
  We recommend agreeing to a 100% offset for monitoring fees and transaction fees, but excluding directors' fees and advisory fees from the offset.</p>
  <p>In Fund IV, UmberPension received an 80% offset covering monitoring and transaction fees (Side Letter 2(b)). The expansion to 100% for monitoring and transaction fees reflects a broader market shift — 55% of LPs (41 of 74) in the current comment round requested 100% on these fee types, and we are recommending this as a base LPA change (see Redline LPA 3.1(f)). However, directors' fees have historically been excluded from offset provisions in all Crestonridge Equity funds and we recommend maintaining that position.</p>
  <p><em>Note: The GP has expressed a preference to hold firm on economic provisions. The move from 80% to 100% on monitoring/transaction fees is an economic concession. However, given the 55% LP consensus and the fact that this is being incorporated into the base LPA, we believe this is defensible as a market-driven adjustment rather than an LP-specific concession. We flag this for the partner's attention.</em></p>
  <p><strong>Fund IV Precedent:</strong> Side Letter 2(b) — 80% offset, monitoring and transaction fees only. Directors' fees excluded.</p>
  <p><strong>Suggested Redline:</strong> Section 3.1(f) — revise "80% of the sum of" to "100% of the sum of"; retain existing carve-out for directors' fees.</p>
  <hr/>
  <h3>Comment 3.1(c) — Management Fee Waiver on Co-Investments</h3>
  <p><strong>LP Comment:</strong><br/>
  UmberPension requests that no Management Fee be charged on any co-investment amounts committed by UmberPension alongside the Fund.</p>
  <p><strong>Disposition:</strong> Agree — Consistent with Precedent</p>
  <p><strong>Recommended Response:</strong><br/>
  Agreed. This is standard for Tier 1 investors and was granted to UmberPension in Fund IV (Side Letter 2(c)). Co-investment vehicles have not been subject to management fees in any Crestonridge Equity fund. No LPA change is required — co-investment fee treatment is addressed in the co-investment side letter provisions.</p>
  <p><strong>Fund IV Precedent:</strong> Side Letter 2(c) — Agreed. Co-investment not subject to Management Fee.</p>
  <p><strong>Suggested Redline:</strong> None — addressed in side letter.</p>
  <hr/>
  <h2>Section 4.2 — Carried Interest and Distributions</h2>
  <h3>Comment 4.2(a) — Whole-Fund Waterfall</h3>
  <p><strong>LP Comment:</strong><br/>
  UmberPension requests that the distribution waterfall be restructured as a whole-fund (European-style) waterfall, with Carried Interest calculated on aggregate fund returns rather than on a deal-by-deal basis.</p>
  <p><strong>Disposition:</strong> Decline — Against Precedent</p>
  <p><strong>Recommended Response:</strong><br/>
  We recommend declining this request. Crestonridge Equity has used a deal-by-deal waterfall in Fund III, Fund IV, and the current draft. This was raised by UmberPension in Fund IV and declined. The deal-by-deal structure is consistent with U.S. buyout market convention, and no shift in market practice warrants a change in approach.</p>
  <p>To mitigate UmberPension's concern about early carry distributions on unrealized gains, we recommend offering enhanced clawback protections (see Comment 4.2(b) below), which address the underlying economic risk without restructuring the waterfall.</p>
  <p><strong>Fund IV Precedent:</strong> Declined. Same request raised by Ashford Keene; same disposition.</p>
  <p><strong>Suggested Redline:</strong> None.</p>
  <hr/>
  <h3>Comment 4.2(b) — Carry Clawback Escrow</h3>
  <p><strong>LP Comment:</strong><br/>
  UmberPension requests that the General Partner establish an escrow account funded with 30% of all Carried Interest distributions, to be held as security for the General Partner's clawback obligations under Section 4.5.</p>
  <p><strong>Disposition:</strong> Agree with Modification</p>
  <p><strong>Recommended Response:</strong><br/>
  We recommend agreeing to an escrow of 25% of Carried Interest distributions, held in a joint account with release mechanics tied to subsequent fund performance.</p>
  <p>UmberPension received a 25% escrow in Fund IV (Side Letter 3(a)), and we recommend maintaining that level. The request for 30% exceeds both the Fund IV precedent and current market convention for U.S. buyout funds. The 25% escrow with a joint account mechanism provides meaningful clawback security while remaining consistent with the GP's prior commitments.</p>
  <p><em>Note: This provision is MFN-excluded in the draft side letter. Only UmberPension and BronzePension receive the carry escrow. Confirm that this exclusion is reflected in the MFN election schedule.</em></p>
  <p><strong>Fund IV Precedent:</strong> Side Letter 3(a) — 25% escrow, joint account, release mechanics upon achievement of 1.5x net MOIC threshold.</p>
  <p><strong>Suggested Redline:</strong> None — side letter provision only.</p>
  <hr/>
  <h2>Section 5.3 — Key Person</h2>
  <h3>Comment 5.3(a) — Named Key Persons</h3>
  <p><strong>LP Comment:</strong><br/>
  UmberPension requests that Jane Smith (Chief Investment Officer) be added as a named Key Person in addition to the two founding partners currently listed in Section 5.3(a).</p>
  <p><strong>Disposition:</strong> Agree — Consistent with Precedent</p>
  <p><strong>Recommended Response:</strong><br/>
  Agreed. Ms. Smith was promoted to CIO following the Fund IV close and is now the third most senior investment professional at the firm. 51 of 74 LPs (69%) have requested her inclusion as a Key Person, and we are recommending this as a base LPA change.</p>
  <p>This was not addressed in Fund IV (Ms. Smith held a different role at the time), but the addition is consistent with the intent of the Key Person clause and reflects the GP's current organizational structure.</p>
  <p><strong>Fund IV Precedent:</strong> Not applicable — Ms. Smith was not CIO during Fund IV. Directionally consistent with the Fund IV approach of naming the most senior investment professionals.</p>
  <p><strong>Suggested Redline:</strong> Section 5.3(a) — add "Jane Smith" to the list of Key Persons.</p>
  <hr/>
  <h3>Comment 5.3(b) — Automatic Suspension</h3>
  <p><strong>LP Comment:</strong><br/>
  UmberPension requests that a Key Person Event trigger an automatic suspension of the Investment Period, rather than a consultation right with the LPAC.</p>
  <p><strong>Disposition:</strong> Agree — Consistent with Precedent (Modified)</p>
  <p><strong>Recommended Response:</strong><br/>
  Agreed, with a 120-day cure period before suspension becomes permanent. This is being recommended as a base LPA change — 51 of 74 LPs requested automatic suspension and the GP has indicated willingness to be more flexible on governance provisions in this fund.</p>
  <p>In Fund IV, a Key Person Event triggered an LPAC consultation right only, with no automatic suspension. This is a departure from Fund IV precedent, but reflects evolving market expectations and the GP's stated flexibility on governance.</p>
  <p><em>Note: This is a governance departure from Fund IV. We are recommending it based on: (1) 69% LP consensus, (2) the GP's stated flexibility on governance for Fund V, and (3) movement in market practice since 2022. Flagging for partner confirmation.</em></p>
  <p><strong>Fund IV Precedent:</strong> Section 5.3(b) — LPAC consultation right only; no automatic suspension. This recommendation is a departure.</p>
  <p><strong>Suggested Redline:</strong> Section 5.3(b) — strike "the General Partner shall consult with the Advisory Committee" and replace with "the Investment Period shall be automatically suspended, subject to a cure period of one hundred and twenty (120) days."</p>
  <hr/>
  <h2>Section 6.1 — Investment Restrictions</h2>
  <h3>Comment 6.1(a) — Concentration Limit</h3>
  <p><strong>LP Comment:</strong><br/>
  UmberPension requests that the maximum amount that may be invested in any single Portfolio Company be reduced from 25% to 15% of aggregate Commitments.</p>
  <p><strong>Disposition:</strong> Agree with Modification</p>
  <p><strong>Recommended Response:</strong><br/>
  We recommend agreeing to a reduction to 20%, but not 15%. A 20% concentration cap was agreed in Fund IV (Section 6.1(a) of the executed LPA) and is being recommended as a base LPA change for Fund V based on 59% LP consensus (44 of 74 LPs). A 15% cap would be unusually restrictive for a fund of this size and could limit the GP's ability to lead larger transactions.</p>
  <p><strong>Fund IV Precedent:</strong> Section 6.1(a) — 20% cap agreed in the executed LPA.</p>
  <p><strong>Suggested Redline:</strong> Section 6.1(a) — revise "25%" to "20%."</p>
  <hr/>
  <h3>Comment 6.1(b) — ESG Investment Exclusions</h3>
  <p><strong>LP Comment:</strong><br/>
  UmberPension requests that the Fund be prohibited from making investments in companies whose primary business involves thermal coal extraction, Arctic drilling, or the manufacture of civilian firearms.</p>
  <p><strong>Disposition:</strong> Flag for Review — Novel Request</p>
  <p><strong>Recommended Response:</strong><br/>
  This request partially overlaps with ESG exclusion requests from other LPs but adds a novel element (civilian firearms) that was not raised in Fund IV or Fund III. We recommend the following:</p>
  <p>Thermal coal and Arctic drilling exclusions are being addressed through side letter provisions for LPs with specific ESG requirements (see Side Letter Provisions Chart). 14 LPs have requested some form of ESG exclusion, and we are proposing a standardized ESG Exclusion Schedule that can be elected via side letter.</p>
  <p>The civilian firearms exclusion is novel — no Crestonridge Equity fund has included this restriction, and only UmberPension and one other LP (JasperPension) raised it. We flag this for the partner's judgment. Granting it as a fund-level restriction could narrow the deal pipeline; granting it as a UmberPension-specific excuse right would limit the impact to a single LP's capital allocation.</p>
  <p><strong>Fund IV Precedent:</strong> No ESG exclusion provisions in Fund IV LPA or side letters. Novel for Crestonridge Equity funds.</p>
  <p><strong>Suggested Redline:</strong> To be determined pending partner review. Options: (1) fund-level exclusion in Section 6.1, (2) UmberPension-specific excuse right in side letter, (3) standardized ESG Exclusion Schedule electable via side letter.</p>
  <hr/>
  <h3>Comment 6.1(c) — ESG Reporting Standards</h3>
  <p><strong>LP Comment:</strong><br/>
  UmberPension requests that the General Partner provide annual reporting in compliance with the Task Force on Climate-Related Financial Disclosures (TCFD) framework and make commercially reasonable efforts to collect Scope 1 and Scope 2 emissions data from Portfolio Companies.</p>
  <p><strong>Disposition:</strong> Flag for Review — Novel Request</p>
  <p><strong>Recommended Response:</strong><br/>
  This is a novel request with no Fund IV or Fund III precedent. ESG reporting requests of this specificity are a newer market development, driven in part by LP regulatory obligations (SFDR for European LPs, and evolving disclosure expectations for U.S. public pensions).</p>
  <p>22 comments across 14 LPs raised some form of ESG reporting requirement, though the specifics vary — UmberPension and four other LPs referenced TCFD; three European LPs referenced SFDR-aligned principal adverse impact indicators; and the remaining LPs used more general language.</p>
  <p>We flag this for the partner's review. If the GP is willing to commit to TCFD reporting, it could be addressed as a base LPA provision (given the breadth of LP interest) or as a side letter commitment. The Scope 1/2 emissions data collection is the more difficult commitment — "commercially reasonable efforts" provides flexibility but creates a reporting obligation the GP has not previously undertaken.</p>
  <p><strong>Fund IV Precedent:</strong> None. Novel for Crestonridge Equity funds.</p>
  <p><strong>Suggested Redline:</strong> To be determined pending partner review.</p>
  <hr/>
  <h2>Section 8.4 — LP Advisory Committee</h2>
  <h3>Comment 8.4(a) — LPAC Approval Rights</h3>
  <p><strong>LP Comment:</strong><br/>
  UmberPension requests that the Advisory Committee have approval rights (rather than consultation rights) over all transactions involving conflicts of interest between the General Partner and the Fund, including all transactions with Affiliates of the General Partner.</p>
  <p><strong>Disposition:</strong> Agree — Consistent with Precedent (Modified)</p>
  <p><strong>Recommended Response:</strong><br/>
  Agreed, with a $10M materiality threshold. Transactions involving Affiliates of the General Partner above $10M will require LPAC approval; transactions below $10M will remain subject to LPAC consultation.</p>
  <p>This is being recommended as a base LPA change based on 64% LP consensus (47 of 74 LPs). In Fund IV, the LPAC had consultation rights only. This is a governance departure, consistent with the GP's stated flexibility on governance provisions.</p>
  <p><strong>Fund IV Precedent:</strong> Section 8.4(a) — LPAC consultation right only. This recommendation is a departure, with a materiality threshold not present in the LP's request.</p>
  <p><strong>Suggested Redline:</strong> Section 8.4(a) — revise "the General Partner shall consult with the Advisory Committee" to "the General Partner shall obtain the approval of the Advisory Committee" and add "with respect to any such transaction involving consideration in excess of $10,000,000."</p>
  <hr/>
  <h3>Comment 8.4(b) — LPAC Seat</h3>
  <p><strong>LP Comment:</strong><br/>
  UmberPension requests a guaranteed seat on the LP Advisory Committee for so long as UmberPension remains a Limited Partner in the Fund.</p>
  <p><strong>Disposition:</strong> Agree — Consistent with Precedent</p>
  <p><strong>Recommended Response:</strong><br/>
  Agreed. UmberPension held an LPAC seat in Fund IV and Fund III. This provision is MFN-excluded (the Advisory Committee is capped at 9 seats) and will be addressed in UmberPension's side letter.</p>
  <p><strong>Fund IV Precedent:</strong> Side Letter 5(a) — Guaranteed LPAC seat. MFN-excluded.</p>
  <p><strong>Suggested Redline:</strong> None — side letter provision only.</p>
  <hr/>
  <h2>Section 10.2 — Transfer Restrictions</h2>
  <h3>Comment 10.2(a) — Affiliate Transfers</h3>
  <p><strong>LP Comment:</strong><br/>
  UmberPension requests the right to transfer its Limited Partner Interest to any Affiliate of UmberPension without the prior written consent of the General Partner.</p>
  <p><strong>Disposition:</strong> Agree — Consistent with Precedent</p>
  <p><strong>Recommended Response:</strong><br/>
  Agreed, for transfers to controlled Affiliates with the same beneficial owner. The GP retains consent rights for transfers to third parties or non-controlled Affiliates. This is consistent with Fund IV (Side Letter 6(a)) and is being recommended as a base LPA change based on 53% LP consensus (39 of 74 LPs).</p>
  <p><strong>Fund IV Precedent:</strong> Side Letter 6(a) — Agreed for controlled Affiliates. GP consent retained for third-party transfers.</p>
  <p><strong>Suggested Redline:</strong> Section 10.2(c) — add new subsection: "Notwithstanding Section 10.2(a), a Limited Partner may transfer all or a portion of its Interest to a controlled Affiliate without the prior written consent of the General Partner, provided that (i) such Affiliate is controlled by, or under common control with, the transferring Limited Partner..."</p>
`;

const SIDE_LETTER_CONTENT = `
  <h2 style="text-align: center">SIDE LETTER</h2>
  <p style="text-align: center"><strong>CRESTVIEW CAPITAL PARTNERS FUND V, L.P.</strong></p>
  <hr/>
  <p>This Side Letter (this "Side Letter") is entered into as of [●], 2026, by and between:</p>
  <p><strong>(1)</strong> Crestonridge Equity Advisors LLC, a Delaware limited liability company, in its capacity as the general partner (the "General Partner") of Crestonridge Equity Partners Fund V, L.P., a Delaware limited partnership (the "Fund"); and</p>
  <p><strong>(2)</strong> The Umber Public Pension System ("UmberPension" or the "Limited Partner"),</p>
  <p>each a "Party" and together the "Parties."</p>
  <hr/>
  <h2>RECITALS</h2>
  <p><strong>WHEREAS</strong>, the Fund has been formed pursuant to that certain Amended and Restated Agreement of Limited Partnership, dated as of [●], 2026 (as amended, restated, supplemented, or otherwise modified from time to time, the "Partnership Agreement");</p>
  <p><strong>WHEREAS</strong>, the Limited Partner has agreed to make a Capital Commitment to the Fund in the amount of <strong>Two Hundred Million Dollars ($200,000,000)</strong> (the "Commitment");</p>
  <p><strong>WHEREAS</strong>, the General Partner and the Limited Partner desire to supplement and, to the extent set forth herein, modify certain provisions of the Partnership Agreement as they apply to the Limited Partner, subject to the terms and conditions set forth in this Side Letter;</p>
  <p><strong>WHEREAS</strong>, Section [●] of the Partnership Agreement authorizes the General Partner to enter into side letters or other written agreements with one or more Limited Partners that have the effect of establishing rights under, or supplementing or altering the terms of, the Partnership Agreement with respect to such Limited Partner(s); and</p>
  <p><strong>WHEREAS</strong>, capitalized terms used but not defined herein shall have the meanings assigned to them in the Partnership Agreement.</p>
  <p><strong>NOW, THEREFORE</strong>, in consideration of the mutual covenants and agreements contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:</p>
  <hr/>
  <h2>Section 1 — Management Fee Modification</h2>
  <h3>1.1 Post-Investment Period Fee Step-Down</h3>
  <p>Notwithstanding Section 3.1(b) of the Partnership Agreement, following the expiration or earlier termination of the Investment Period, the Management Fee payable by the Limited Partner shall be calculated at the rate of <strong>one and three-quarters percent (1.75%)</strong> per annum of the Limited Partner's pro rata share of Invested Capital (at cost), in lieu of the rate and basis of calculation otherwise set forth in Section 3.1(b) of the Partnership Agreement.</p>
  <p>For the avoidance of doubt, during the Investment Period, the Management Fee payable by the Limited Partner shall continue to be calculated at the rate of two percent (2.0%) per annum of the Limited Partner's Commitment, in accordance with Section 3.1(a) of the Partnership Agreement.</p>
  <h3>1.2 Fee Offset</h3>
  <p>Notwithstanding Section 3.1(f) of the Partnership Agreement, the Management Fee payable by the Limited Partner shall be reduced by <strong>one hundred percent (100%)</strong> of the Limited Partner's pro rata share of all Monitoring Fees and Transaction Fees (each as defined in Section 3.1(f) of the Partnership Agreement) received by the General Partner or any of its Affiliates from any Portfolio Company during the applicable period.</p>
  <p>For the avoidance of doubt, this offset shall not apply to (i) Directors' Fees, (ii) Advisory Fees, or (iii) any fees or compensation received by an employee or principal of the General Partner in his or her capacity as a director or board observer of a Portfolio Company.</p>
  <hr/>
  <h2>Section 2 — Carried Interest Escrow</h2>
  <h3>2.1 Escrow Account</h3>
  <p>The General Partner shall establish and maintain an escrow account (the "Escrow Account") with a nationally recognized financial institution, into which the General Partner shall deposit an amount equal to <strong>twenty-five percent (25%)</strong> of each distribution of Carried Interest otherwise distributable to the General Partner (or its designees) pursuant to Section 4.2(c) of the Partnership Agreement.</p>
  <h3>2.2 Release Mechanics</h3>
  <p>Amounts held in the Escrow Account shall be released to the General Partner upon the earlier of:</p>
  <p>(a) the date on which the Fund has achieved net distributions to all Limited Partners equal to or in excess of <strong>one and one-half times (1.5x)</strong> the aggregate Capital Contributions of all Limited Partners (the "Release Threshold");</p>
  <p>(b) the date that is twelve (12) months following the final distribution by the Fund upon its dissolution and winding up; or</p>
  <p>(c) the date on which the General Partner's clawback obligation under Section 4.5 of the Partnership Agreement has been finally determined (whether by agreement or by a court of competent jurisdiction) to be zero.</p>
  <h3>2.3 Joint Account</h3>
  <p>The Escrow Account shall be established as a joint account requiring the signatures of both a representative of the General Partner and a representative designated by the Advisory Committee for any withdrawal or release of funds. The Escrow Account shall be invested in cash equivalents, U.S. Treasury securities, or money market instruments, at the direction of the General Partner.</p>
  <h3>2.4 MFN Exclusion</h3>
  <p><strong>This Section 2 shall not be subject to any most favored nation election right</strong> under Section [●] of the Partnership Agreement or any other Side Letter entered into by the General Partner with any other Limited Partner. This Section 2 reflects terms individually negotiated with the Limited Partner and is not intended to be available to other Limited Partners of the Fund.</p>
  <hr/>
  <h2>Section 3 — Co-Investment</h2>
  <h3>3.1 Pro Rata Co-Investment Right</h3>
  <p>Subject to the terms of this Section 3, the General Partner shall, prior to offering co-investment opportunities to third parties that are not Limited Partners, offer the Limited Partner the opportunity to co-invest alongside the Fund on a <strong>pro rata basis</strong> (based on the ratio of the Limited Partner's Commitment to the aggregate Commitments of all Limited Partners) in each investment made by the Fund in which the total equity investment (including Fund and co-investment capital) exceeds the amount to be invested by the Fund alone.</p>
  <h3>3.2 Notice and Election</h3>
  <p>The General Partner shall provide the Limited Partner with written notice of each co-investment opportunity at least <strong>ten (10) Business Days</strong> prior to the anticipated closing of such co-investment. The Limited Partner shall notify the General Partner in writing within seven (7) Business Days of receipt of such notice whether it elects to participate in such co-investment opportunity.</p>
  <h3>3.3 Terms</h3>
  <p>Any co-investment made by the Limited Partner pursuant to this Section 3 shall be made on terms no less favorable to the Limited Partner than those applicable to the Fund's investment, including with respect to pricing, and shall not be subject to Management Fees or Carried Interest.</p>
  <h3>3.4 Allocation</h3>
  <p>The Limited Partner acknowledges that the General Partner may, in its sole discretion and consistent with any co-investment allocation policy adopted by the General Partner from time to time, reduce the Limited Partner's pro rata allocation in any particular co-investment opportunity to accommodate co-investment rights granted to other Limited Partners or to third-party co-investors. The General Partner shall use commercially reasonable efforts to provide the Limited Partner with its full pro rata share over the life of the Fund on an aggregate basis.</p>
  <hr/>
  <h2>Section 4 — Advisory Committee</h2>
  <h3>4.1 LPAC Seat Guarantee</h3>
  <p>For so long as the Limited Partner maintains a Capital Commitment to the Fund of at least <strong>One Hundred Fifty Million Dollars ($150,000,000)</strong> (as may be reduced by distributions), the Limited Partner shall be entitled to appoint one (1) representative to serve on the Advisory Committee established pursuant to Section 8.4 of the Partnership Agreement. The Limited Partner may designate an alternate representative to attend meetings of the Advisory Committee in the absence of its primary representative.</p>
  <h3>4.2 MFN Exclusion</h3>
  <p><strong>This Section 4 shall not be subject to any most favored nation election right</strong> under Section [●] of the Partnership Agreement or any other Side Letter entered into by the General Partner with any other Limited Partner. The Advisory Committee is limited to nine (9) members, and the inclusion of this provision in the most favored nation process could result in the Advisory Committee exceeding its intended size.</p>
  <hr/>
  <h2>Section 5 — Transfer</h2>
  <h3>5.1 Affiliate Transfers</h3>
  <p>Notwithstanding Section 10.2(a) of the Partnership Agreement, the Limited Partner may, without the prior written consent of the General Partner, transfer all or any portion of its Interest in the Fund to any entity that is a controlled Affiliate of the Limited Partner, provided that:</p>
  <p>(a) such Affiliate is controlled by, or under common control with, the Limited Partner;</p>
  <p>(b) the transferring Limited Partner provides the General Partner with at least fifteen (15) Business Days' prior written notice of such transfer, together with such documentation as the General Partner may reasonably request to confirm the Affiliate relationship;</p>
  <p>(c) the transferee Affiliate agrees in writing to be bound by the terms of the Partnership Agreement and this Side Letter; and</p>
  <p>(d) such transfer would not result in a violation of applicable law or cause the Fund to be treated as a "publicly traded partnership" within the meaning of Section 7704 of the Internal Revenue Code of 1986, as amended.</p>
  <p>For the avoidance of doubt, any transfer to an entity that is not a controlled Affiliate of the Limited Partner shall remain subject to the prior written consent of the General Partner in accordance with Section 10.2(a) of the Partnership Agreement.</p>
  <hr/>
  <h2>Section 6 — ESG Exclusions</h2>
  <h3>6.1 Excuse Right</h3>
  <p><em>[Note: This provision is pending partner review. The following is draft language for a UmberPension-specific excuse right. An alternative approach would be to apply a fund-level exclusion under Section 6.1 of the Partnership Agreement. See Response Memo Comment 6.1(b) for options.]</em></p>
  <p>The Limited Partner shall have the right to be excused from participating in any investment by the Fund in a Portfolio Company whose primary business, as reasonably determined by the General Partner at the time of the Fund's initial investment, involves:</p>
  <p>(a) the extraction or production of thermal coal;</p>
  <p>(b) drilling or exploration activities in the Arctic National Wildlife Refuge or equivalent designated Arctic regions; or</p>
  <p>(c) [the manufacture or sale of civilian firearms — <em>pending partner review</em>].</p>
  <p>Upon exercise of such excuse right, the Limited Partner's Capital Commitment shall not be called for such investment, and the Limited Partner's allocable share of such investment shall be reallocated among the remaining Limited Partners (or, at the General Partner's election, offered as a co-investment opportunity) in accordance with the reallocation procedures set forth in Section [●] of the Partnership Agreement.</p>
  <hr/>
  <h2>Section 7 — Most Favored Nation</h2>
  <h3>7.1 MFN Election Right</h3>
  <p>If the General Partner enters into any Side Letter or similar agreement with any other Limited Partner that provides such other Limited Partner with rights, terms, or provisions that are more favorable than the rights, terms, or provisions provided to the Limited Partner hereunder or under the Partnership Agreement (other than rights, terms, or provisions that are expressly excluded from this most favored nation provision), the General Partner shall, within <strong>thirty (30) days</strong> following the final closing of the Fund, notify the Limited Partner of such more favorable rights, terms, or provisions and provide the Limited Partner with the opportunity to elect to receive the benefit of any or all of such rights, terms, or provisions.</p>
  <h3>7.2 Election Period</h3>
  <p>The Limited Partner shall have <strong>forty-five (45) days</strong> following receipt of the notice described in Section 7.1 to notify the General Partner in writing of those rights, terms, or provisions the Limited Partner elects to receive (each, an "MFN Election"). Any such MFN Election shall be effective as of the date of the Limited Partner's original admission to the Fund.</p>
  <h3>7.3 Exclusions</h3>
  <p>The following provisions are excluded from the most favored nation election right set forth in this Section 7 and may not be elected by any Limited Partner:</p>
  <p>(a) the Carried Interest escrow provisions set forth in Section 2 of this Side Letter or any comparable provision in any other Side Letter;</p>
  <p>(b) the Advisory Committee seat provisions set forth in Section 4 of this Side Letter or any comparable provision in any other Side Letter;</p>
  <p>(c) any provision granting a reduced rate of Carried Interest; and</p>
  <p>(d) any provision that is specific to the legal, tax, or regulatory status of a particular Limited Partner (including ERISA-related provisions, tax treaty provisions, and provisions required by the laws of a particular jurisdiction applicable to such Limited Partner).</p>
  <hr/>
  <h2>Section 8 — General Provisions</h2>
  <h3>8.1 Relationship to Partnership Agreement</h3>
  <p>Except as expressly modified by this Side Letter, the Partnership Agreement shall remain in full force and effect in accordance with its terms. In the event of any conflict between the terms of this Side Letter and the terms of the Partnership Agreement, the terms of this Side Letter shall control with respect to the Limited Partner.</p>
  <h3>8.2 Confidentiality</h3>
  <p>This Side Letter and its contents are confidential and shall not be disclosed by either Party to any third party without the prior written consent of the other Party, except (a) to such Party's legal, tax, and financial advisors, (b) as required by applicable law, regulation, or legal process, or (c) as required by the California Public Records Act or any similar applicable public records or freedom of information law (provided that the Limited Partner shall provide the General Partner with prompt written notice of any such required disclosure to the extent permitted by law).</p>
  <h3>8.3 Amendment</h3>
  <p>This Side Letter may not be amended, modified, or supplemented except by a written instrument executed by both Parties.</p>
  <h3>8.4 Governing Law</h3>
  <p>This Side Letter shall be governed by, and construed in accordance with, the laws of the State of Delaware, without regard to its conflicts of law principles.</p>
  <h3>8.5 Counterparts</h3>
  <p>This Side Letter may be executed in any number of counterparts, each of which shall be deemed an original and all of which together shall constitute one and the same instrument.</p>
  <hr/>
  <p style="text-align: center"><strong>IN WITNESS WHEREOF</strong>, the Parties have executed this Side Letter as of the date first written above.</p>
  <hr/>
  <p><strong>GENERAL PARTNER:</strong></p>
  <p><strong>Crestonridge Equity Advisors LLC</strong></p>
  <p>By: ______________________________</p>
  <p>Name:</p>
  <p>Title: Authorized Signatory</p>
  <p>Date:</p>
  <hr/>
  <p><strong>LIMITED PARTNER:</strong></p>
  <p><strong>Umber Public Pension System</strong></p>
  <p>By: ______________________________</p>
  <p>Name:</p>
  <p>Title: Investment Director, Private Equity</p>
  <p>Date:</p>
`;

const PANEL_ANIMATION = {
  duration: 0.3,
  ease: "easeOut" as const
};

export default function DraftArtifactPanel({
  selectedArtifact,
  isEditingArtifactTitle,
  editedArtifactTitle,
  onEditedArtifactTitleChange,
  onStartEditingTitle,
  onSaveTitle,
  onClose,
  chatOpen,
  onToggleChat,
  shareArtifactDialogOpen,
  onShareArtifactDialogOpenChange,
  exportReviewDialogOpen,
  onExportReviewDialogOpenChange,
  artifactTitleInputRef,
  sourcesDrawerOpen,
  onSourcesDrawerOpenChange,
  contentType = 'memorandum'
}: DraftArtifactPanelProps) {
  // State to force re-renders on selection change
  const [, forceUpdate] = useState({});
  const [publishPopoverOpen, setPublishPopoverOpen] = useState(false);
  const [publishState, setPublishState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [hasPublished, setHasPublished] = useState(false);

  const handlePublish = () => {
    setPublishState('sending');
    setTimeout(() => setPublishState('sent'), 500);
    setTimeout(() => {
      setPublishPopoverOpen(false);
      setPublishState('idle');
      setHasPublished(true);
    }, 2200);
  };
  
  // Select content based on type
  const editorContent = contentType === 's1-shell' ? S1_SHELL_CONTENT : contentType === 'response-memo' ? RESPONSE_MEMO_CONTENT : contentType === 'side-letter' ? SIDE_LETTER_CONTENT : MEMORANDUM_CONTENT;

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      TrackChangeExtension.configure({
        enabled: false,
        onStatusChange: (status: boolean) => {
          console.log('Track change status:', status);
        },
      }),
    ],
    content: editorContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-full text-fg-base',
        'data-placeholder': 'Start writing your document...',
      },
    },
    onUpdate: () => {
      // Force re-render to update toolbar button states
      forceUpdate({});
    },
    onSelectionUpdate: () => {
      // Force re-render when selection changes to update active states
      forceUpdate({});
    },
  });
  
  // Track previous contentType to only update when it actually changes
  const prevContentTypeRef = useRef(contentType);
  
  // Update editor content when contentType changes
  useEffect(() => {
    if (editor && !editor.isDestroyed && prevContentTypeRef.current !== contentType) {
      const newContent = contentType === 's1-shell' ? S1_SHELL_CONTENT : contentType === 'response-memo' ? RESPONSE_MEMO_CONTENT : contentType === 'side-letter' ? SIDE_LETTER_CONTENT : MEMORANDUM_CONTENT;
      editor.commands.setContent(newContent);
      prevContentTypeRef.current = contentType;
    }
  }, [editor, contentType]);
  
  return (
    <>
      <motion.div 
        initial={false}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          opacity: { duration: 0.2, ease: "easeOut" }
        }}
        className="h-full flex flex-col bg-bg-subtle"
      >
        {/* Header */}
        <div className="px-3 py-4 border-b border-border-base bg-bg-base flex items-center justify-between" style={{ height: '52px' }}>
          <div className="flex items-center">
            <img src="/msword.svg" alt="DOCX" className="w-6 h-6 flex-shrink-0" />
            {isEditingArtifactTitle ? (
              <input
                ref={artifactTitleInputRef}
                type="text"
                value={editedArtifactTitle}
                onChange={(e) => onEditedArtifactTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSaveTitle();
                  }
                }}
                onFocus={(e) => {
                  setTimeout(() => {
                    e.target.setSelectionRange(0, 0);
                    e.target.scrollLeft = 0;
                  }, 0);
                }}
                className="text-fg-base font-medium bg-bg-subtle border border-border-interactive outline-none rounded-md text-sm"
                style={{ 
                  width: `${Math.min(Math.max(editedArtifactTitle.length * 8 + 40, 120), 600)}px`,
                  padding: '4px 8px',
                }}
                autoFocus
              />
            ) : (
              <button
                onClick={onStartEditingTitle}
                className="text-fg-base font-medium rounded-md hover:bg-bg-subtle transition-colors cursor-pointer text-sm"
                style={{ padding: '4px 8px' }}
              >
                {selectedArtifact?.title || 'Artifact'}
              </button>
            )}
          </div>
          
          <div className="flex gap-2 items-center">
            {/* Publish Button with Popover */}
            <Popover open={publishPopoverOpen} onOpenChange={(open) => { if (!open && publishState === 'idle') setPublishPopoverOpen(false); else if (open) { setPublishPopoverOpen(true); if (!hasPublished) setPublishState('idle'); } }}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="medium" 
                  className={`gap-1.5 ${publishPopoverOpen ? "bg-bg-subtle" : ""}`}
                >
                  <SvgIcon src="/central_icons/Send.svg" alt="Publish" width={14} height={14} className="text-fg-base" />
                  Publish
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={4} className="w-[320px] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                <div className="p-4 flex flex-col gap-3 overflow-hidden relative">
                  {/* Header — always visible */}
                  <div>
                    <p className="text-sm font-semibold text-fg-base">Publish to shared space</p>
                    <p className="text-xs text-fg-muted mt-0.5">Send this document back to the original commenting investor.</p>
                  </div>
                  {/* Card preview — fades up when publishing */}
                  <div className="relative" style={{ height: 120 }}>
                    <motion.div
                      animate={publishState === 'idle' ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                      <div className="border border-border-base rounded-lg overflow-hidden" style={{ height: 120 }}>
                        <div className="px-3 py-2 border-b border-border-base flex items-center gap-2">
                          <img src="/msword.svg" alt="" className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs font-medium text-fg-base truncate">{selectedArtifact?.title || "Document"}</span>
                        </div>
                        <div className="px-3 py-2.5">
                          <p className="text-[7px] text-fg-subtle leading-[1.5] m-0">This memorandum responds to the comment letter submitted on behalf of the Limited Partner with respect to the draft Limited Partnership Agreement. The comment letter contains discrete comments spanning multiple sections of the draft LPA. Our recommended dispositions are summarized below and detailed in the section-by-section response that follows.</p>
                          <p className="text-[7px] text-fg-subtle leading-[1.5] m-0 mt-1.5">The comment letter contains 67 discrete comments spanning 14 sections of the draft LPA. Our recommended dispositions are summarized below and detailed in the section-by-section response that follows.</p>
                        </div>
                      </div>
                    </motion.div>
                    {publishState === 'idle' && <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-bg-base via-bg-base/70 to-transparent rounded-b-lg z-10" />}
                  </div>
                  {/* Button — overlaps the bottom of the card */}
                  <div className="-mt-5 relative z-20">
                    {hasPublished ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button variant="default" className="w-full h-7" disabled>
                              Published
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={4} style={{ width: 'var(--radix-popper-anchor-width)' }}><p>Artifact is already published. Make changes to the artifact to publish a new version.</p></TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button variant="default" className="w-full h-7" onClick={publishState === 'idle' ? handlePublish : undefined} disabled={publishState !== 'idle'}>
                        {publishState === 'idle' ? 'Publish' : publishState === 'sending' ? 'Publishing...' : 'Published'}
                      </Button>
                    )}
                  </div>
                  {/* Success check — appears after card fades */}
                  {publishState === 'sent' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6" style={{ top: 20 }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'publish-scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
                        <circle cx="12" cy="12" r="10" fill="var(--ui-success-fg)" />
                        <path d="M8 12.5L10.5 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ strokeDasharray: 14, strokeDashoffset: 14, animation: 'publish-check-draw 0.4s ease-out 0.3s forwards' }} />
                      </svg>
                      <p className="text-xs text-fg-subtle text-center" style={{ animation: 'publish-fade-in 0.3s ease-out 0.5s forwards', opacity: 0 }}>Response memo has been successfully published to shared space</p>
                    </div>
                  )}
                </div>
                <style>{`
                  @keyframes publish-scale-in {
                    from { transform: scale(0); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                  }
                  @keyframes publish-check-draw {
                    to { stroke-dashoffset: 0; }
                  }
                  @keyframes publish-fade-in {
                    to { opacity: 1; }
                  }
                `}</style>
              </PopoverContent>
            </Popover>
            {/* Export Button */}
            <Button 
              variant="outline" 
              size="medium" 
              className="gap-1.5"
              onClick={() => onExportReviewDialogOpenChange(true)}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            {/* Close Button - only show when chat is open (artifact context) */}
            {chatOpen && (
              <button 
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-[7px] hover:bg-bg-subtle transition-colors text-fg-subtle"
                title="Close artifact"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18"/>
                  <path d="M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <DraftDocumentToolbar
          chatOpen={chatOpen}
          onToggleChat={() => {
            console.log('Toggle button clicked, current state:', chatOpen);
            onToggleChat(!chatOpen);
          }}
          onCloseArtifact={onClose}
          editor={editor}
          onEditModeChange={(mode) => {
            editor?.commands.setTrackChangeStatus(mode === 'suggesting');
          }}
        />
        
        {/* Content Area */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden bg-bg-base cursor-text min-h-0"
          onClick={(e) => {
            // Focus the editor when clicking anywhere in the content area
            // Only if the click target is the container itself or its direct children
            const target = e.target as HTMLElement;
            if (editor && !editor.isFocused && !target.closest('.ProseMirror')) {
              editor.chain().focus('end').run();
            }
          }}
        >
          <div className="flex justify-center">
            <div className="w-full max-w-[1000px] px-8 py-10">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dialogs */}
      <ShareArtifactDialog
        isOpen={shareArtifactDialogOpen}
        onClose={() => onShareArtifactDialogOpenChange(false)}
        artifactTitle={selectedArtifact?.title || 'Artifact'}
      />
      <ExportReviewDialog
        isOpen={exportReviewDialogOpen}
        onClose={() => onExportReviewDialogOpenChange(false)}
        artifactTitle={selectedArtifact?.title || 'Artifact'}
      />
    </>
  );
}