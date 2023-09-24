// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as fsExtra from "fs-extra";
import * as mkcert from "mkcert";
import * as path from "path";
import * as defaults from "./defaults";
import { validateCertificateAndKey } from "./verify";

/* global console */

/* Generate operation will check if there is already valid certificate installed.
   if yes, then this operation will be no op.
   else, new certificates are generated and installed if --install was provided.
*/
export async function generateCertificates(
  pkiConfig: Required<defaults.PKIConfig>
) {
  const localPath = defaults.getLocalPath(pkiConfig.cert.fileName!);
  try {
    fsExtra.ensureDirSync(path.dirname(defaults.caCertificatePath));
    fsExtra.ensureDirSync(path.dirname(`${localPath}.crt`));
    fsExtra.ensureDirSync(path.dirname(`${localPath}.key`));
  } catch (err) {
    throw new Error(`Unable to create the directory.\n${err}`);
  }

  const caCertPath = path.join(
    defaults.certificateDirectory,
    defaults.caCertificateFileName
  );
  const caKeyPath = path.join(
    defaults.certificateDirectory,
    defaults.caKeyFileName
  );
  let caExists: boolean = false;
  try{
    caExists = fs.existsSync(caCertPath) && fs.existsSync(caKeyPath);
  } catch(err){
    caExists = false;
  }
  let caCertKey: { certificate: string; key: string } | undefined = undefined;
  if(caExists) {
    try {
      caCertKey = validateCertificateAndKey(caCertPath, caKeyPath);
    } catch (err) {
      caExists = false;
    }
  }
  if(!caCertKey){
    const ca = pkiConfig.ca;
    const caCertificateInfo: mkcert.CACertificateInfo = {
      countryCode: ca.countryCode!,
      locality: ca.locality!,
      organization: ca.organization!,
      state: ca.state!,
      validityDays: ca.validityDays!,
    };
    try {
      const caCertificate = await mkcert.createCA(caCertificateInfo);
      caCertKey = { certificate: caCertificate.cert, key: caCertificate.key };
    } catch (err) {
      throw new Error(`Unable to generate the CA certificate.\n${err}`);
    }
  }

  const localhostCertificateInfo: mkcert.CertificateInfo = {
    caCert: caCertKey.certificate,
    caKey: caCertKey.key,
    domains: pkiConfig.cert.domains!,
    validityDays: pkiConfig.cert.validityDays!,
  };
  let localhostCertificate: mkcert.Certificate;
  try {
    localhostCertificate = await mkcert.createCert(localhostCertificateInfo);
  } catch (err) {
    throw new Error(`Unable to generate the localhost certificate.\n${err}`);
  }

  try {
    if (!caExists) {
      fs.writeFileSync(defaults.caCertificatePath, caCertKey.certificate);
      const caCertificateKeyPath = path.join(
        defaults.certificateDirectory,
        "ca.key"
      );
      fs.writeFileSync(caCertificateKeyPath, caCertKey.key);
    }
    fs.writeFileSync(`${localPath}.crt`, localhostCertificate.cert);
    fs.writeFileSync(`${localPath}.key`, localhostCertificate.key);
  } catch (err) {
    throw new Error(`Unable to write generated certificates.\n${err}`);
  }

  if (defaults.caCertificatePath) {
    console.log(
      `The developer certificates have been generated in ${defaults.certificateDirectory}`
    );
  } else {
    console.log("The developer certificates have been generated.");
  }
}

