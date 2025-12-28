/**
 * Contract Components Index
 * 
 * Exports all Islamic contract report components, field components, and utilities
 */

// Individual contract reports
export { MurabahaReport } from './murabaha-report';
export { MudarabahReport } from './mudarabah-report';
export { MusharakahReport } from './musharakah-report';
export { IjarahReport } from './ijarah-report';
export { SalamReport } from './salam-report';

// Contract field components (for application forms)
export { MurabahaFields } from './murabaha-fields';
export { MudarabahFields } from './mudarabah-fields';
export { MusharakahFields } from './musharakah-fields';
export { IjarahFields } from './ijarah-fields';
export { SalamFields } from './salam-fields';

// Unified contract report router
export { 
  ContractReport,
  ContractReportSkeleton,
  getContractDisplayName,
  getContractIcon,
  type ContractTerms,
} from './contract-report';
