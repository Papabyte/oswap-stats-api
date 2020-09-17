"use strict";
const path = require('path');
require('dotenv').config({ path: path.dirname(process.mainModule.paths[0]) + '/.env' });

exports.bServeAsHub = false;
exports.bLight = true;

exports.apiPort = process.env.testnet ? 4101 : 4100;

exports.hub = process.env.testnet ? 'obyte.org/bb-test' : 'obyte.org/bb';
exports.explorer_base_url = process.env.testnet ? 'https://testnetexplorer.obyte.org/#' : 'https://explorer.obyte.org/#';

exports.factory_aa = process.env.testnet ? "PFNAFDKV6HKKFIEB2R2ZE4IAPSDNNIGX" : "B22543LKSS35Z55ROU4GDN26RT6MDKWU";
exports.oswap_base_aa = process.env.testnet ? "5DNICJLNOBPANH536Y7YVBN5ZDBLQ4LE" : "GS23D3GQNNMNJ5TL4Z5PINZ5626WASMA";
exports.token_registry_aa_address = process.env.testnet ? "O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ" : "O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ";

console.log('finished server conf');
