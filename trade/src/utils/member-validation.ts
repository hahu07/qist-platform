/**
 * Member/Investor Frontend Validations
 * UX/convenience validations for better user experience
 * These can be bypassed but provide early feedback
 */

import type { IndividualInvestor, CorporateInvestor } from "@/schemas";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

/**
 * 1. AGE VERIFICATION (18+)
 * Validate investor meets minimum age requirement
 */
export function validateAge(dateOfBirth: string | undefined): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!dateOfBirth) {
    return { isValid: true, errors }; // Optional field
  }

  try {
    // Parse DD-MM-YYYY format
    const parts = dateOfBirth.split('-');
    if (parts.length !== 3) {
      errors.dateOfBirth = "Invalid date format. Use DD-MM-YYYY";
      return { isValid: false, errors };
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    const year = parseInt(parts[2], 10);

    const birthDate = new Date(year, month, day);
    const today = new Date();
    
    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Check minimum age (18+)
    if (age < 18) {
      errors.dateOfBirth = `You must be at least 18 years old to invest. Current age: ${age}`;
      return { isValid: false, errors };
    }

    // Warning for very young investors
    const warnings: Record<string, string> = {};
    if (age >= 18 && age < 21) {
      warnings.dateOfBirth = "Investment involves risk. Ensure you understand all terms before proceeding.";
    }

    return { isValid: true, errors, warnings };
  } catch (error) {
    errors.dateOfBirth = "Invalid date format";
    return { isValid: false, errors };
  }
}

/**
 * 2. PORTFOLIO ALLOCATION VALIDATION
 * Ensure business + crypto allocations total 100%
 */
export function validatePortfolioAllocation(
  businessPool: number,
  cryptoPool: number
): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  const total = businessPool + cryptoPool;

  if (total !== 100) {
    errors.allocation = `Portfolio allocation must total 100%. Current: ${total}%`;
    return { isValid: false, errors };
  }

  // Warnings for extreme allocations
  if (businessPool === 0 || cryptoPool === 0) {
    warnings.allocation = "Consider diversifying across both pools to reduce risk";
  }

  if (businessPool > 90 || cryptoPool > 90) {
    warnings.allocation = "Heavy concentration in one pool increases risk. Consider diversification.";
  }

  return { isValid: true, errors, warnings };
}

/**
 * 3. RISK PROFILE MATCHING
 * Validate investment choices match declared risk profile
 */
export function validateRiskProfileMatch(
  riskProfile: "conservative" | "moderate" | "aggressive",
  businessPoolAllocation: number,
  cryptoPoolAllocation: number
): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Conservative investors should have lower crypto allocation
  if (riskProfile === "conservative" && cryptoPoolAllocation > 30) {
    warnings.riskProfile = 
      `Your crypto allocation (${cryptoPoolAllocation}%) is high for a conservative risk profile. Consider reducing to 30% or less.`;
  }

  // Aggressive investors typically have higher crypto allocation
  if (riskProfile === "aggressive" && cryptoPoolAllocation < 40) {
    warnings.riskProfile = 
      `Your crypto allocation (${cryptoPoolAllocation}%) is low for an aggressive risk profile. You may want to increase it to 40% or more.`;
  }

  // Moderate should be balanced
  if (riskProfile === "moderate") {
    if (cryptoPoolAllocation < 20 || cryptoPoolAllocation > 50) {
      warnings.riskProfile = 
        `For moderate risk profile, crypto allocation between 20-50% is recommended. Current: ${cryptoPoolAllocation}%`;
    }
  }

  return { isValid: true, errors, warnings };
}

/**
 * 4. KYC FIELD COMPLETENESS
 * Check all required KYC fields are filled before submission
 */
export function validateKYCCompleteness(
  profile: Partial<IndividualInvestor> | Partial<CorporateInvestor>
): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (profile.investorType === "individual") {
    const individual = profile as Partial<IndividualInvestor>;
    
    // Identity fields
    if (!individual.fullName?.trim()) {
      errors.fullName = "Full name is required for KYC verification";
    }
    if (!individual.dateOfBirth) {
      errors.dateOfBirth = "Date of birth is required for KYC verification";
    }
    if (!individual.nationality) {
      errors.nationality = "Nationality is required for KYC verification";
    }
    if (!individual.idType) {
      errors.idType = "ID type is required for KYC verification";
    }
    if (!individual.idNumber?.trim()) {
      errors.idNumber = "ID number is required for KYC verification";
    }
    
    // Contact fields
    if (!individual.email?.trim()) {
      errors.email = "Email is required for communication";
    }
    if (!individual.phone?.trim()) {
      errors.phone = "Phone number is required for verification";
    }
    
    // Address
    if (!individual.address?.street?.trim()) {
      errors["address.street"] = "Street address is required for KYC verification";
    }
    if (!individual.address?.city?.trim()) {
      errors["address.city"] = "City is required for KYC verification";
    }
    if (!individual.address?.country?.trim()) {
      errors["address.country"] = "Country is required for KYC verification";
    }
    
    // Employment & financial
    if (!individual.employmentStatus) {
      errors.employmentStatus = "Employment status is required for risk assessment";
    }
    if (!individual.occupation?.trim()) {
      errors.occupation = "Occupation is required for KYC verification";
    }
    if (!individual.sourceOfFunds) {
      errors.sourceOfFunds = "Source of funds is required for AML compliance";
    }
    
    // Next of kin
    if (!individual.nextOfKin?.fullName?.trim()) {
      errors["nextOfKin.fullName"] = "Next of kin name is required";
    }
    if (!individual.nextOfKin?.phone?.trim()) {
      errors["nextOfKin.phone"] = "Next of kin phone is required";
    }
    
    // Agreements
    if (!individual.agreeToTerms) {
      errors.agreeToTerms = "You must agree to terms and conditions";
    }
    if (!individual.agreeToShariah) {
      errors.agreeToShariah = "You must agree to Shariah compliance";
    }
    
  } else if (profile.investorType === "corporate") {
    const corporate = profile as Partial<CorporateInvestor>;
    
    // Corporate identity
    if (!corporate.companyName?.trim()) {
      errors.companyName = "Company name is required for KYC verification";
    }
    if (!corporate.registrationNumber?.trim()) {
      errors.registrationNumber = "Registration number is required for KYC verification";
    }
    if (!corporate.legalEntityType) {
      errors.legalEntityType = "Legal entity type is required";
    }
    if (!corporate.incorporationDate) {
      errors.incorporationDate = "Incorporation date is required";
    }
    if (!corporate.registrationCountry) {
      errors.registrationCountry = "Registration country is required";
    }
    
    // Business details
    if (!corporate.industry?.trim()) {
      errors.industry = "Industry is required for risk assessment";
    }
    if (!corporate.businessDescription?.trim()) {
      errors.businessDescription = "Business description is required";
    }
    
    // Authorized representative
    if (!corporate.authorizedRepresentative?.fullName?.trim()) {
      errors["authorizedRepresentative.fullName"] = "Representative name is required";
    }
    if (!corporate.authorizedRepresentative?.idNumber?.trim()) {
      errors["authorizedRepresentative.idNumber"] = "Representative ID number is required";
    }
    
    // Beneficial owners (UBO)
    if (!corporate.beneficialOwners || corporate.beneficialOwners.length === 0) {
      errors.beneficialOwners = "At least one beneficial owner (25%+ ownership) must be disclosed";
    } else {
      corporate.beneficialOwners.forEach((owner, idx) => {
        if (!owner.fullName?.trim()) {
          errors[`beneficialOwners.${idx}.fullName`] = `Owner ${idx + 1}: Name is required`;
        }
        if (!owner.nationality) {
          errors[`beneficialOwners.${idx}.nationality`] = `Owner ${idx + 1}: Nationality is required`;
        }
        if (!owner.idNumber?.trim()) {
          errors[`beneficialOwners.${idx}.idNumber`] = `Owner ${idx + 1}: ID number is required`;
        }
        if (owner.ownershipPercentage === undefined || owner.ownershipPercentage < 25) {
          errors[`beneficialOwners.${idx}.ownershipPercentage`] = `Owner ${idx + 1}: Must own at least 25%`;
        }
      });
    }
    
    // Agreements
    if (!corporate.agreeToTerms) {
      errors.agreeToTerms = "You must agree to terms and conditions";
    }
    if (!corporate.agreeToShariah) {
      errors.agreeToShariah = "You must agree to Shariah compliance";
    }
  }
  
  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
}

/**
 * 5. PROFILE COMPLETENESS CHECK
 * Calculate completion percentage for profile
 */
export function calculateProfileCompleteness(
  profile: Partial<IndividualInvestor> | Partial<CorporateInvestor>
): { percentage: number; missingFields: string[] } {
  const missingFields: string[] = [];
  let totalFields = 0;
  let completedFields = 0;
  
  if (profile.investorType === "individual") {
    const individual = profile as Partial<IndividualInvestor>;
    
    const requiredFields = {
      "Full Name": individual.fullName,
      "Email": individual.email,
      "Phone": individual.phone,
      "Date of Birth": individual.dateOfBirth,
      "Nationality": individual.nationality,
      "ID Type": individual.idType,
      "ID Number": individual.idNumber,
      "Street Address": individual.address?.street,
      "City": individual.address?.city,
      "Country": individual.address?.country,
      "Employment Status": individual.employmentStatus,
      "Occupation": individual.occupation,
      "Source of Funds": individual.sourceOfFunds,
      "Next of Kin Name": individual.nextOfKin?.fullName,
      "Next of Kin Phone": individual.nextOfKin?.phone,
      "Risk Profile": individual.riskProfile,
      "Terms Agreement": individual.agreeToTerms,
      "Shariah Agreement": individual.agreeToShariah,
    };
    
    totalFields = Object.keys(requiredFields).length;
    
    Object.entries(requiredFields).forEach(([fieldName, value]) => {
      if (value && value !== "" && value !== false) {
        completedFields++;
      } else {
        missingFields.push(fieldName);
      }
    });
    
  } else if (profile.investorType === "corporate") {
    const corporate = profile as Partial<CorporateInvestor>;
    
    const requiredFields = {
      "Company Name": corporate.companyName,
      "Registration Number": corporate.registrationNumber,
      "Legal Entity Type": corporate.legalEntityType,
      "Incorporation Date": corporate.incorporationDate,
      "Registration Country": corporate.registrationCountry,
      "Industry": corporate.industry,
      "Business Description": corporate.businessDescription,
      "Email": corporate.email,
      "Phone": corporate.phone,
      "Representative Name": corporate.authorizedRepresentative?.fullName,
      "Representative ID": corporate.authorizedRepresentative?.idNumber,
      "Beneficial Owners": corporate.beneficialOwners && corporate.beneficialOwners.length > 0,
      "Risk Profile": corporate.riskProfile,
      "Terms Agreement": corporate.agreeToTerms,
      "Shariah Agreement": corporate.agreeToShariah,
    };
    
    totalFields = Object.keys(requiredFields).length;
    
    Object.entries(requiredFields).forEach(([fieldName, value]) => {
      if (value && value !== "" && value !== false) {
        completedFields++;
      } else {
        missingFields.push(fieldName);
      }
    });
  }
  
  const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  
  return { percentage, missingFields };
}

/**
 * 6. EMAIL FORMAT VALIDATION
 * Validate email format (basic check)
 */
export function validateEmailFormat(email: string | undefined): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!email) {
    return { isValid: true, errors }; // Will be caught by required field validation
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    errors.email = "Please enter a valid email address";
    return { isValid: false, errors };
  }
  
  // Common typos warning
  const warnings: Record<string, string> = {};
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (domain && !commonDomains.includes(domain)) {
    const typos = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
    };
    
    if (typos[domain as keyof typeof typos]) {
      warnings.email = `Did you mean ${email.split('@')[0]}@${typos[domain as keyof typeof typos]}?`;
    }
  }
  
  return { isValid: true, errors, warnings };
}

/**
 * 7. PHONE FORMAT VALIDATION
 * Validate phone number format (basic check)
 */
export function validatePhoneFormat(phone: string | undefined): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!phone) {
    return { isValid: true, errors }; // Will be caught by required field validation
  }
  
  // Remove all non-digit characters for length check
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length < 10) {
    errors.phone = "Phone number must be at least 10 digits";
    return { isValid: false, errors };
  }
  
  if (digitsOnly.length > 15) {
    errors.phone = "Phone number too long (max 15 digits)";
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors };
}

/**
 * 8. COMPREHENSIVE VALIDATION
 * Run all validations at once
 */
export function validateMemberProfile(
  profile: Partial<IndividualInvestor> | Partial<CorporateInvestor>
): ValidationResult {
  const allErrors: Record<string, string> = {};
  const allWarnings: Record<string, string> = {};
  
  // 1. Age validation (individual only)
  if (profile.investorType === "individual") {
    const individual = profile as Partial<IndividualInvestor>;
    const ageResult = validateAge(individual.dateOfBirth);
    Object.assign(allErrors, ageResult.errors);
    if (ageResult.warnings) Object.assign(allWarnings, ageResult.warnings);
  }
  
  // 2. Portfolio allocation
  const businessPool = profile.businessPoolAllocation ?? 0;
  const cryptoPool = profile.cryptoPoolAllocation ?? 0;
  const allocationResult = validatePortfolioAllocation(businessPool, cryptoPool);
  Object.assign(allErrors, allocationResult.errors);
  if (allocationResult.warnings) Object.assign(allWarnings, allocationResult.warnings);
  
  // 3. Risk profile matching
  if (profile.riskProfile) {
    const riskResult = validateRiskProfileMatch(profile.riskProfile, businessPool, cryptoPool);
    if (riskResult.warnings) Object.assign(allWarnings, riskResult.warnings);
  }
  
  // 4. Email format
  const emailResult = validateEmailFormat(profile.email);
  Object.assign(allErrors, emailResult.errors);
  if (emailResult.warnings) Object.assign(allWarnings, emailResult.warnings);
  
  // 5. Phone format
  const phoneResult = validatePhoneFormat(profile.phone);
  Object.assign(allErrors, phoneResult.errors);
  
  // 6. KYC completeness
  const kycResult = validateKYCCompleteness(profile);
  Object.assign(allErrors, kycResult.errors);
  
  const isValid = Object.keys(allErrors).length === 0;
  
  return {
    isValid,
    errors: allErrors,
    warnings: Object.keys(allWarnings).length > 0 ? allWarnings : undefined,
  };
}
