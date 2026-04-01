import {
  LEGAL_LAST_UPDATED,
  PRIVACY_POLICY_INTRO,
  PRIVACY_POLICY_SECTIONS,
} from '@/constants/legal';
import { LegalDocumentScreen } from '@/components/legal/LegalDocumentScreen';

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocumentScreen
      title="Privacy Policy"
      intro={PRIVACY_POLICY_INTRO}
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={PRIVACY_POLICY_SECTIONS}
    />
  );
}
