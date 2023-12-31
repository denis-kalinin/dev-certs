// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as os from "os";
import * as path from "path";
import * as usageData from "office-addin-usage-data";

// Default certificate names
export const certificateDirectoryName = ".office-addin-dev-certs";
// eslint-disable-next-line prettier/prettier
export const certificateDirectory = path.join(os.homedir(), certificateDirectoryName);
export const caCertificateFileName = "ca.crt";
export const caKeyFileName = "ca.key";
// eslint-disable-next-line prettier/prettier
export const caCertificatePath = path.join(certificateDirectory, caCertificateFileName);
export const localhostCertificateFileName = "localhost.crt";
// eslint-disable-next-line prettier/prettier
export const localhostCertificatePath = path.join(certificateDirectory, localhostCertificateFileName);
export const localhostKeyFileName = "localhost.key";
// eslint-disable-next-line prettier/prettier
export const localhostKeyPath = path.join(certificateDirectory, localhostKeyFileName);

// Default certificate details
export const certificateName = "Developer CA for Microsoft Office Add-ins";
export const countryCode = "US";
export const daysUntilCertificateExpires = 30;
export const domain = ["127.0.0.1", "localhost"];
export const locality = "Redmond";
export const state = "WA";

// Usage data defaults
export const usageDataObject: usageData.OfficeAddinUsageData =
  new usageData.OfficeAddinUsageData({
    projectName: "office-addin-dev-certs",
    instrumentationKey: usageData.instrumentationKeyForOfficeAddinCLITools,
    raisePrompt: false,
  });

export function getPkiConfig(): Required<PKIConfig> {
  return {
    ca: {
      countryCode,
      locality,
      state,
      validityDays: daysUntilCertificateExpires,
      organization: certificateName,
    },
    cert: {
      validityDays: daysUntilCertificateExpires,
      domains: domain,
      fileName: "localhost",
    },
  };
}
export function getLocalPath(certificateFileName: string): string {
  return path.join(certificateDirectory, `${certificateFileName}`);
}

// Type which represent's CA certificate generation input parameters
export interface CACertInfo {
  organization?: string;
  countryCode?: string;
  state?: string;
  locality?: string;
  validityDays?: number;
}

// Type which represent's certificate generation input parameters
export interface CertInfo {
  domains?: string[];
  validityDays?: number;
  fileName?: string;
  caKey?: string;
  caCert?: string;
}
export interface PKIConfig {
  ca?: CACertInfo;
  cert?: CertInfo;
}
