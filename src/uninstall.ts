// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { execSync } from "child_process";
import * as fsExtra from "fs-extra";
import * as path from "path";
import * as defaults from "./defaults";
import { isCaCertificateInstalled } from "./verify";
import { usageDataObject } from "./defaults";
import { ExpectedError } from "office-addin-usage-data";

/* global process, console, __dirname */

function getUninstallCommand(machine: boolean = false): string {
  switch (process.platform) {
    case "win32": {
      const script = path.resolve(__dirname, "..\\scripts\\uninstall.ps1");
      const caScope = machine ? "LocalMachine" : "CurrentUser";
      return `powershell -ExecutionPolicy Bypass -File "${script}" ${caScope} "${defaults.certificateName}"`;
    }
    case "darwin": {
      // macOS
      const script = path.resolve(__dirname, "../scripts/uninstall.sh");
      return `sudo sh '${script}' '${defaults.certificateName}'`;
    }
    case "linux": {
      const script = path.resolve(__dirname, "../scripts/uninstall_linux.sh");
      return `sudo sh '${script}' '${defaults.certificateName}'`;
    }
    default:
      throw new ExpectedError(`Platform not supported: ${process.platform}`);
  }
}

// Deletes the generated certificate files and delete the certificate directory if its empty
export function deleteCertificateFiles(
  certificateDirectory: string = defaults.certificateDirectory,
  filename?: string
): void {
  if (fsExtra.existsSync(certificateDirectory)) {
    const files = fsExtra.readdirSync(certificateDirectory);
    if (filename){
      for( const file of files ){
        if ( file == `${filename}.cert` || file == `${filename}.key` ){
          fsExtra.removeSync(path.join(certificateDirectory, file));
        }
      } 
    }else {
      for( const file of files ){
        if ( file !== defaults.caCertificateFileName && file !== defaults.caKeyFileName ){
          fsExtra.removeSync(path.join(certificateDirectory, file));
        }
      }
    }

    if (fsExtra.readdirSync(certificateDirectory).length === 0) {
      fsExtra.removeSync(certificateDirectory);
    }
  }
}

export async function uninstallCaCertificate(
  machine: boolean = false,
  verbose: boolean = true
) {
  if (isCaCertificateInstalled(/* returnInvalidCertificate */ true)) {
    const command = getUninstallCommand(machine);

    try {
      console.log(
        `Uninstalling CA certificate "Developer CA for Microsoft Office Add-ins"...`
      );
      execSync(command, { stdio: "pipe" });
      console.log(`You no longer have trusted access to https://localhost.`);
      usageDataObject.reportSuccess("uninstallCaCertificate()");
    } catch (error: any) {
      usageDataObject.reportException("uninstallCaCertificate()", error);
      throw new Error(
        `Unable to uninstall the CA certificate.\n${error.stderr.toString()}`
      );
    } finally {
      if (fsExtra.existsSync(defaults.certificateDirectory)) {
        fsExtra.removeSync(path.join(defaults.certificateDirectory, defaults.caCertificateFileName));
        fsExtra.removeSync(path.join(defaults.certificateDirectory, defaults.caKeyFileName));
      }
    }
  } else {
    if (fsExtra.existsSync(defaults.certificateDirectory)) {
      fsExtra.removeSync(path.join(defaults.certificateDirectory, defaults.caCertificateFileName));
      fsExtra.removeSync(path.join(defaults.certificateDirectory, defaults.caKeyFileName));
    }
    if (verbose) {
      console.log("The CA certificate is not installed.");
    }
  }
}
