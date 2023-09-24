// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as defaults from "./defaults";
import { ensureCertificatesAreInstalled } from "./install";

/* global Buffer */

interface IHttpsServerOptions {
  ca: Buffer;
  cert: Buffer;
  key: Buffer;
}

export async function getHttpsServerOptions(
  pkiConfig?: defaults.PKIConfig
): Promise<IHttpsServerOptions> {
  const defaultPkiConfig = defaults.getPkiConfig();
  const fullPkiConfig: Required<defaults.PKIConfig> = {
    ca: {
      ...defaultPkiConfig.ca,
      ...pkiConfig?.ca
    },
    cert: {
      ...defaultPkiConfig.cert,
      ...pkiConfig?.cert
    }
  };
  await ensureCertificatesAreInstalled(false, fullPkiConfig);

  const httpsServerOptions = {} as IHttpsServerOptions;
  try {
    httpsServerOptions.ca = fs.readFileSync(defaults.caCertificatePath);
  } catch (err) {
    throw new Error(`Unable to read the CA certificate file.\n${err}`);
  }

  try {
    httpsServerOptions.cert = fs.readFileSync(
      `${defaults.getLocalPath(fullPkiConfig.cert.fileName!)}.crt`
    );
  } catch (err) {
    throw new Error(`Unable to read the certificate file.\n${err}`);
  }

  try {
    httpsServerOptions.key = fs.readFileSync(
      `${defaults.getLocalPath(fullPkiConfig.cert.fileName!)}.key`
    );
  } catch (err) {
    throw new Error(`Unable to read the certificate key.\n${err}`);
  }

  return httpsServerOptions;
}
