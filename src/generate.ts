// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as fsExtra from "fs-extra";
import * as mkcert from "mkcert";
import * as path from "path";
import * as defaults from "./defaults";
import { CACertInfo, CertInfo } from "./defaults";

/* global console */

/* Generate operation will check if there is already valid certificate installed.
   if yes, then this operation will be no op.
   else, new certificates are generated and installed if --install was provided.
*/
export async function generateCertificates(
  caCertificatePath: string = defaults.caCertificatePath,
  localhostCertificatePath: string = defaults.localhostCertificatePath,
  localhostKeyPath: string = defaults.localhostKeyPath,
  pkiConfig?: { ca?: CACertInfo; cert?: CertInfo }
) {
  try {
    fsExtra.ensureDirSync(path.dirname(caCertificatePath));
    fsExtra.ensureDirSync(path.dirname(localhostCertificatePath));
    fsExtra.ensureDirSync(path.dirname(localhostKeyPath));
  } catch (err) {
    throw new Error(`Unable to create the directory.\n${err}`);
  }

  const defaultCACertificateInfo: mkcert.CACertificateInfo = {
    countryCode: defaults.countryCode,
    locality: defaults.locality,
    organization: defaults.certificateName,
    state: defaults.state,
    validityDays: defaults.daysUntilCertificateExpires,
  };
  const caCertificateInfo: mkcert.CACertificateInfo = { ...defaultCACertificateInfo, ...pkiConfig?.ca };
  let caCertificate: mkcert.Certificate;
  try {
    caCertificate = await mkcert.createCA(caCertificateInfo);
  } catch (err) {
    throw new Error(`Unable to generate the CA certificate.\n${err}`);
  }

  const defaultLocalhostCertificateInfo: mkcert.CertificateInfo = {
    caCert: caCertificate.cert,
    caKey: caCertificate.key,
    domains: defaults.domain,
    validityDays: defaults.daysUntilCertificateExpires,
  };
  const localhostCertificateInfo = { ...defaultLocalhostCertificateInfo, ...pkiConfig?.cert };
  let localhostCertificate: mkcert.Certificate;
  try {
    localhostCertificate = await mkcert.createCert(localhostCertificateInfo);
  } catch (err) {
    throw new Error(`Unable to generate the localhost certificate.\n${err}`);
  }

  try {
    if (!fs.existsSync(caCertificatePath)) {
      fs.writeFileSync(`${caCertificatePath}`, caCertificate.cert);
      fs.writeFileSync(`${localhostCertificatePath}`, localhostCertificate.cert);
      fs.writeFileSync(`${localhostKeyPath}`, localhostCertificate.key);
    }
  } catch (err) {
    throw new Error(`Unable to write generated certificates.\n${err}`);
  }

  if (caCertificatePath === defaults.caCertificatePath) {
    console.log("The developer certificates have been generated in " + defaults.certificateDirectory);
  } else {
    console.log("The developer certificates have been generated.");
  }
}