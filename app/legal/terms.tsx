import {
  LEGAL_LAST_UPDATED,
  TERMS_OF_USE_INTRO,
  TERMS_OF_USE_SECTIONS,
} from '@/constants/legal';
import { LegalDocumentScreen } from '@/components/legal/LegalDocumentScreen';

export default function TermsScreen() {
  return (
    <LegalDocumentScreen
      title="Terms of Use (EULA)"
      intro={TERMS_OF_USE_INTRO}
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={TERMS_OF_USE_SECTIONS}
    />
  );
}
