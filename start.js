const conf = require('ocore/conf.js');
const network = require('ocore/network.js');
const eventBus = require('ocore/event_bus.js');
const lightWallet = require('ocore/light_wallet.js');
const storage = require('ocore/storage.js');
const walletGeneral = require('ocore/wallet_general.js');
const objectHash = require('ocore/object_hash.js');
const sqlite_tables = require('./sqlite_tables.js');
const db = require('ocore/db.js');
const api = require('./api.js');

lightWallet.setLightVendorHost(conf.hub);

eventBus.on('connected', function(ws){
	network.initWitnessesIfNecessary(ws, start);
});


async function treatResponseFromOswapAA(objResponse, objInfos){

	const oswapAaAddress = objInfos.address;
	const oswap_asset = objInfos.swap_asset;
	const asset0 = objInfos.asset_0;
	const asset1 = objInfos.asset_1;

	if (objResponse.response.responseVars && objResponse.response.responseVars.type == 'mint'){

		const objTriggerUnit = await storage.readUnit(objResponse.trigger_unit);
		if (!objTriggerUnit)
			throw Error('trigger unit not found ' + objResponse.trigger_unit);
	
		const objResponseUnit = await getJointFromStorageOrHub(objResponse.response_unit);
		if (!objResponseUnit)
			throw Error('response unit not found ' + objResponse.trigger_unit);

		const timestamp = new Date(objResponseUnit.timestamp * 1000).toISOString();
		const asset0_amount = getAmountToAa(objTriggerUnit, oswapAaAddress, asset0); 
		const asset1_amount = getAmountToAa(objTriggerUnit, oswapAaAddress, asset1); 
	
		const oswap_asset_amount = objResponse.response.responseVars.asset_amount;


		const oswapAaVars = await getStateVars(oswapAaAddress);
		const supply = oswapAaVars.supply;

		if (asset0_amount > 0){
			await db.query("INSERT INTO trades (response_unit, base, quote, base_qty, quote_qty, type, timestamp) VALUES (?,?,?,?,?,?,?)", 
			[objResponse.response_unit, asset0, oswap_asset, asset0_amount, oswap_asset_amount / 2, 'sell', timestamp]);
			api.refreshMarket(asset0, oswap_asset);
		}
		if (asset1_amount > 0){
			await db.query("INSERT INTO trades (response_unit, base, quote, base_qty, quote_qty, type, timestamp,indice) VALUES (?,?,?,?,?,?,?,1)", 
			[objResponse.response_unit, asset1, oswap_asset, asset1_amount, oswap_asset_amount / 2, 'sell', timestamp]);
			api.refreshMarket(asset1, oswap_asset);
		}
		await saveSupplyForAsset(oswap_asset, supply);
	}

	if (objResponse.response.responseVars && objResponse.response.responseVars.type == 'burn'){

		const objTriggerUnit = await storage.readUnit(objResponse.trigger_unit);
		if (!objTriggerUnit)
			throw Error('trigger unit not found ' + objResponse.trigger_unit);
	
	

		const objResponseUnit = await getJointFromStorageOrHub(objResponse.response_unit);
		if (!objResponseUnit)
			throw Error('response unit not found ' + objResponse.trigger_unit);

		const timestamp = new Date(objResponseUnit.timestamp * 1000).toISOString();
		const oswap_asset_amount = getAmountToAa(objTriggerUnit, oswapAaAddress, oswap_asset); 
	
		const asset0_amount = objResponse.response.responseVars.asset0_amount;
		const asset1_amount = objResponse.response.responseVars.asset1_amount;

		const oswapAaVars = await getStateVars(oswapAaAddress);
		const supply = oswapAaVars.supply;

		if (asset0_amount > 0){
			await db.query("INSERT INTO trades (response_unit, base, quote, base_qty, quote_qty, type, timestamp) VALUES (?,?,?,?,?,?,?)", 
			[objResponse.response_unit, asset0, oswap_asset, asset0_amount, oswap_asset_amount / 2, 'buy', timestamp]);
			api.refreshMarket(asset0, oswap_asset);
		}
		if (asset1_amount > 0){
			await db.query("INSERT INTO trades (response_unit, base, quote, base_qty, quote_qty, type, timestamp,indice) VALUES (?,?,?,?,?,?,?,1)", 
			[objResponse.response_unit, asset1, oswap_asset, asset1_amount, oswap_asset_amount / 2, 'buy', timestamp]);
			api.refreshMarket(asset1, oswap_asset);
		}
		await saveSupplyForAsset(oswap_asset, supply);
	}

	if (objResponse.response.responseVars && objResponse.response.responseVars.type == 'swap'){

		const objTriggerUnit = await storage.readUnit(objResponse.trigger_unit);
		if (!objTriggerUnit)
			throw Error('trigger unit not found ' + objResponse.trigger_unit);

		const objResponseUnit = await getJointFromStorageOrHub(objResponse.response_unit);
		if (!objResponseUnit)
			throw Error('response unit not found ' + objResponse.trigger_unit);

		const timestamp = new Date(objResponseUnit.timestamp * 1000).toISOString();
	
		const asset0_amount_in = getAmountToAa(objTriggerUnit, oswapAaAddress, asset0); 
		const asset1_amount_in = getAmountToAa(objTriggerUnit, oswapAaAddress, asset1); 

		const asset0_amount_out = objResponse.response.responseVars.asset0_amount || 0;
		const asset1_amount_out = objResponse.response.responseVars.asset1_amount || 0;

		if (asset0_amount_out > 0){
			await db.query("INSERT INTO trades (response_unit, base, quote, base_qty, quote_qty, type, timestamp) VALUES (?,?,?,?,?,?,?)", 
			[objResponse.response_unit, asset1, asset0, asset1_amount_in, asset0_amount_out, 'sell', timestamp]);
		}
		if (asset1_amount_out > 0){
			await db.query("INSERT INTO trades (response_unit, base, quote, base_qty, quote_qty, type, timestamp) VALUES (?,?,?,?,?,?,?)", 
			[objResponse.response_unit, asset1, asset0, asset1_amount_out, asset0_amount_in, 'buy', timestamp]);
		}
		api.refreshMarket(asset1, asset0);
	}
}


eventBus.on('aa_response', async function(objResponse){
	if(objResponse.response.error)
		return console.log('ignored response with error: ' + objResponse.response.error);
	const aa_address = objResponse.aa_address;

	var rows = await db.query("SELECT * FROM oswap_aas WHERE address=?",[aa_address]);
	if (rows[0])
		return treatResponseFromOswapAA(objResponse, rows[0]);

});


function getAmountToAa(objTriggerUnit, aa_address, asset = 'base'){

	if (!objTriggerUnit)
		return 0;
	let amount = 0;
	objTriggerUnit.messages.forEach(function (message){
		if (message.app !== 'payment')
			return;
		const payload = message.payload;
		if (asset == 'base' && payload.asset || asset != 'base' && asset !== payload.asset)
			return;
		payload.outputs.forEach(function (output){
			if (output.address === aa_address) {
				amount += output.amount; // in case there are several outputs
			}
		});
	});
	return amount;
}


async function start(){
	await sqlite_tables.create();
	await discoverOswapAas()
	network.addLightWatchedAa(conf.oswap_base_aa, null, err => {
		if (err)
			throw Error(err);
	});
	network.addLightWatchedAa(conf.token_registry_aa_address, null, err => {
		if (err)
			throw Error(err);
	});

	api.start();
	setInterval(lightWallet.refreshLightClientHistory, 60*1000);
}


function discoverOswapAas(){
	return new Promise((resolve)=>{
		network.requestFromLightVendor('light/get_aas_by_base_aas', {
			base_aa: conf.oswap_base_aa
		}, async function(ws, request, arrResponse){
			console.log(arrResponse);
			const allAaAddresses = arrResponse.map(obj => obj.address);
			const rows = await db.query("SELECT address FROM oswap_aas WHERE address IN("+ allAaAddresses.map(db.escape).join(',')+")");
			const knownAaAddresses = rows.map(obj => obj.address);
			const newOswapAas = arrResponse.filter(address => !knownAaAddresses.includes(address))
			await Promise.all(newOswapAas.map(saveAndwatchOswapAa));
			resolve();
		});
	})
}

async function saveAndwatchOswapAa(objAa){
	return new Promise(async function(resolve){
		await	saveOswapAa(objAa);
		walletGeneral.addWatchedAddress(objAa.address, resolve);
	});
}

async function saveSupplyForAsset(asset, supply){
	await db.query("REPLACE INTO supplies (supply,asset) VALUES (?,?)", [supply, asset]);
}


async function saveSymbolForAsset(asset){
	var symbol,decimals, description;
	if (asset !== 'base'){
		var registryVars = await getStateVarsForPrefixes(conf.token_registry_aa_address, [
			'a2s_' + asset, 
			'current_desc_' + asset
		]);
		const current_desc = registryVars['current_desc_' + asset];
		registryVars = Object.assign(registryVars, await getStateVarsForPrefixes(conf.token_registry_aa_address, ['decimals_' + current_desc, 'desc_' + current_desc]));
		symbol = registryVars['a2s_' + asset];
		decimals = registryVars['decimals_' + current_desc];
		description = registryVars['desc_' + current_desc];
		if (!symbol || !decimals){
			console.log('asset ' + asset + ' not found in registry');
			await db.query("DELETE FROM oswap_assets WHERE asset=?", [asset]);
			return;
		}
	} else {
		symbol = 'GBYTE';
		decimals = 9;
		description = 'Obyte DAG native currency';
	};

	await db.query("REPLACE INTO oswap_assets (asset, symbol, decimals, description) VALUES (?,?,?,?)", [asset, symbol, decimals, description]);
}

async function refreshSymbols(){
	console.log("refreshSymbols");
	const rows = await db.query("SELECT swap_asset AS asset FROM oswap_aas UNION SELECT DISTINCT asset_0 AS asset FROM oswap_aas \n\
	UNION SELECT asset_1 AS asset FROM oswap_aas");
	for (var i; i < rows.length; i++)
		await saveSymbolForAsset(rows[i].asset);
	api.initAssetsCache();
}



async function saveOswapAa(objAa){
	return new Promise(async (resolve)=>{

		const oswapAaAddress = objAa.address;
		const asset0 = objAa.definition[1].params.asset0;
		const asset1 = objAa.definition[1].params.asset1;

		const factoryAaVars = await getStateVarsForPrefix(conf.factory_aa, 'pools.' + oswapAaAddress + '.asset');
		const asset = factoryAaVars['pools.' + oswapAaAddress + '.asset'];

		if (!asset)
			return setTimeout(function(){ saveOswapAa(objAa).then(resolve) }, 1000);
		await db.query("INSERT " + db.getIgnore() + " INTO oswap_aas (address, asset_0, asset_1, swap_asset) VALUES (?,?,?,?)", [oswapAaAddress, asset0, asset1, asset]);
		await Promise.all([saveSymbolForAsset(asset), saveSymbolForAsset(asset0), saveSymbolForAsset(asset1)]);
		resolve();
	})
}

function handleJustsaying(ws, subject, body) {
	switch (subject) {
		case 'light/aa_definition':
			onAADefinition(body);
		break;
		case 'light/aa_response':
			if (body.aa_address == conf.token_registry_aa_address)
			refreshSymbols();
		break;
	}
}

eventBus.on("message_for_light", handleJustsaying);

function onAADefinition(objUnit){

	for (var i=0; i<objUnit.messages.length; i++){
		var message = objUnit.messages[i];
		var payload = message.payload;
		if (message.app === 'definition' && payload.definition[1].base_aa){
				const base_aa = payload.definition[1].base_aa;
				if (base_aa == conf.oswap_base_aa){
					const address = objectHash.getChash160(payload.definition);
					const definition = payload.definition;
					saveAndwatchOswapAa({ address, definition });
				}
		}
	}
}


function getStateVarsForPrefixes(aa_address, arrPrefixes){
	return new Promise(function(resolve){
		Promise.all(arrPrefixes.map((prefix)=>{
			return getStateVarsForPrefix(aa_address, prefix)
		})).then((arrResults)=>{
			return resolve(Object.assign({}, ...arrResults));
		}).catch((error)=>{
			return resolve({});
		});
	});
}

function getStateVarsForPrefix(aa_address, prefix, start = '0', end = 'z', firstCall = true){
	return new Promise(function(resolve, reject){
		if (firstCall)
			prefix = prefix.slice(0, -1);
		const CHUNK_SIZE = 2000; // server wouldn't accept higher chunk size

		if (start === end)
			return getStateVarsForPrefix(aa_address, prefix + start,  '0', 'z').then(resolve).catch(reject); // we append prefix to split further

		network.requestFromLightVendor('light/get_aa_state_vars', {
			address: aa_address,
			var_prefix_from: prefix + start,
			var_prefix_to: prefix + end,
			limit: CHUNK_SIZE
		}, function(ws, request, objResponse){
			if (objResponse.error)
				return reject(objResponse.error);

			if (Object.keys(objResponse).length >= CHUNK_SIZE){ // we reached the limit, let's split in two ranges and try again
				const delimiter =  Math.floor((end.charCodeAt(0) - start.charCodeAt(0)) / 2 + start.charCodeAt(0));
				Promise.all([
					getStateVarsForPrefix(aa_address, prefix, start, String.fromCharCode(delimiter), false),
					getStateVarsForPrefix(aa_address, prefix, String.fromCharCode(delimiter +1), end, false)
				]).then(function(results){
					return resolve({...results[0], ...results[1]});
				}).catch(function(error){
					return reject(error);
				})
			} else{
				return resolve(objResponse);
			}

		});
	});
}


function getStateVars(aa_address){
	return new Promise((resolve)=>{
		network.requestFromLightVendor('light/get_aa_state_vars', {
			address: aa_address
		}, function(ws, request, objResponse){
			if (objResponse.error){
				console.log("Error when requesting state vars for " + aa_address + ": " + objResponse.error);
				resolve({});
			} else
				resolve(objResponse);
		});
	});
}

function getJointFromStorageOrHub(unit){
	return new Promise(async (resolve) => {

		var joint = await storage.readUnit(unit);
		if (joint)
			return resolve(joint);
		const network = require('ocore/network.js');
		network.requestFromLightVendor('get_joint', unit,  function(ws, request, response){
			if (response.joint){
				resolve(response.joint.unit)
			} else {
				resolve();
			}
		});
	});
}


process.on('unhandledRejection', up => { throw up });