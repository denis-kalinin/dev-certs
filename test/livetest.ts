import {
    expect,
    use,
    should,
} from 'chai'; 
//import 'chai/register-should';
import * as chaiAsPromised from 'chai-as-promised';


use(chaiAsPromised);
should();

const isDebugMode = () => process.env.DEBUG_MODE === 'true';
const getItTimeout = () : number => isDebugMode() ? 60000 : 7000;



import { getHttpsServerOptions } from "../src/httpsServerOptions";


describe("dev-certs tests", () => {
    it("should create files", () => {
        getHttpsServerOptions({cert: { fileName: "livetest5", domains: ["wordaddin.agiloft.com"]}})
            .should.eventually.have.property("cert");
    })
    .timeout(getItTimeout());
})