// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { execSync } from "child_process";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as defaults from "./defaults";
import { usageDataObject } from "./defaults";
import { ExpectedError } from "office-addin-usage-data";

// On win32 this is a unique hash used with PowerShell command to reliably delineate command output
export const outputMarker =
  process.platform === "win32"
    ? `[${crypto
        .createHash("md5")
        .update(`${defaults.certificateName}${defaults.caCertificatePath}`)
        .digest("hex")}]`
    : "";

/* global process, Buffer, __dirname */

function getVerifyCommand(returnInvalidCertificate: boolean): string {
  switch (process.platform) {
    case "win32": {
      const script = path.resolve(__dirname, "..\\scripts\\verify_ca.ps1");
      const defaultCommand = `powershell -ExecutionPolicy Bypass -File "${script}" -CaCertificateName "${defaults.certificateName}" -CaCertificatePath "${defaults.caCertificatePath}" -OutputMarker "${outputMarker}"`;
      if (returnInvalidCertificate) {
        return defaultCommand + ` -ReturnInvalidCertificate`;
      }
      return defaultCommand;
    }
    case "darwin": {
      // macOS
      const script = path.resolve(__dirname, "../scripts/verify_ca.sh");
      return `sh '${script}' '${defaults.certificateName}'`;
    }
    case "linux": {
      const script = path.resolve(__dirname, "../scripts/verify_ca_linux.sh");
      return `sh '${script}' '${defaults.certificateName}'`;
    }
    default:
      throw new ExpectedError(`Platform not supported: ${process.platform}`);
  }
}

export function isCaCertificateInstalled(
  returnInvalidCertificate: boolean = false
): boolean {
  
  const command = getVerifyCommand(returnInvalidCertificate);
  try {
    const output = execSync(command, { stdio: "pipe" }).toString();
    if (process.platform === "win32") {
      // Remove any PowerShell output that preceeds invoking the actual certificate check command
      return (
        output
          .slice(output.lastIndexOf(outputMarker) + outputMarker.length)
          .trim().length !== 0
      );
    }
    // script files return empty string if the certificate not found or expired
    if (output.length !== 0) {
      return true;
    }
  } catch (error) {
    // Some commands throw errors if the certifcate is not found or expired
  }

  return false;
}

export function isCaInDir(): boolean {
      //check CA has a valid key
      const caCertPath = path.join(
        defaults.certificateDirectory,
        defaults.caCertificateFileName
      );
      const caCertKey = path.join(
        defaults.certificateDirectory,
        defaults.caKeyFileName
      );
      try{ 
        validateCertificateAndKey(caCertPath, caCertKey);
        return true;
      } catch (err) {
        return false;
      }
}

export function validateCertificateAndKey(
  certificatePath: string, keyPath: string
): { certificate: string; key: string } {
  let certificate: string;
  let key: string;

  try {
    certificate = fs.readFileSync(certificatePath).toString();
  } catch (err) {
    throw new Error(`Unable to read the certificate.\n${err}`);
  }

  try {
    key = fs.readFileSync(keyPath).toString();
  } catch (err) {
    throw new Error(`Unable to read the certificate key.\n${err}`);
  }

  let encrypted;

  try {
    encrypted = crypto.publicEncrypt(certificate, Buffer.from("test"));
  } catch (err) {
    throw new Error(`The certificate is not valid.\n${err}`);
  }

  try {
    crypto.privateDecrypt(key, encrypted);
  } catch (err) {
    throw new Error(`The certificate key is not valid.\n${err}`);
  }
  return { certificate, key }
}

function validateIssuer(certificate: string){
  const caPath = path.join(
    defaults.certificateDirectory,
    defaults.caCertificateFileName
  );
  const caCert = new crypto.X509Certificate(fs.readFileSync(caPath));
  const now = new Date();
  if (now < new Date(caCert.validFrom))
    throw new Error("CA certificate is not YET valid.");
  if (now > new Date(caCert.validTo))
    throw new Error("CA certificate is not ALREADY valid");
  const localcert = new crypto.X509Certificate(certificate);
  if (now < new Date(localcert.validFrom))
    throw new Error(`Cert for ${localcert.subject} is not YET valid.`);
  if (now > new Date(localcert.validTo))
    throw new Error(`Cert for ${localcert.subject} is not ALREADY valid.`);
  const isCertChainOk = localcert.checkIssued(caCert);
  if (!isCertChainOk) throw new Error("Certificate chain is wrong.");
}

export function verifyCertificates( filename: string ): boolean {
  const localPath = defaults.getLocalPath(filename);

  try {
    let isCertificateValid: boolean = true;
    try {
      const certKey = validateCertificateAndKey(`${localPath}.crt`, `${localPath}.key`);
      validateIssuer(certKey.certificate);
    } catch (err) {
      isCertificateValid = false;
    }
    usageDataObject.reportSuccess("verifyCertificates()");
    return isCertificateValid;
  } catch (err: any) {
    usageDataObject.reportException("verifyCertificates()", err);
    throw err;
  }
}
