const request     = require('request');
const moment      = require('moment');

let gdUsername = 'GWS/PCC79HG';
let gdPassword = 'Gtha79hg';
let gdProfile  = 'DynGalileoProd_79HG';

module.exports = function(req, res) {
  if(req.body.from && req.headers['token-auth']) {
    let bodyRequest = function(FromCurrency, ToCurrency = 'THB', Amt = 1) { 
      return ` 
        <Request>
          <Transaction>
            <FareQuoteMultiDisplay_12>
              <FareDisplayMods>
                <QueryHeader>
                  <UniqueKey>0000</UniqueKey>
                  <LangNum>00</LangNum>
                  <Action>25</Action>
                  <RetCRTOutput>N</RetCRTOutput>
                  <NoMsg>N</NoMsg>
                  <NoTrunc>Y</NoTrunc>
                  <IMInd>N</IMInd>
                  <FIPlus>N</FIPlus>
                  <PEInd>N</PEInd>
                  <PVInd></PVInd>
                  <NBInd>N</NBInd>
                  <ActionOnlyInd>N</ActionOnlyInd>
                  <TranslatePeriod>N</TranslatePeriod>
                  <PIInd>N</PIInd>
                  <IntFrame1>N</IntFrame1>
                  <SmartParsed>N</SmartParsed>
                  <PDCodes>N</PDCodes>
                  <BkDtOverride>N</BkDtOverride>
                  <HostUse25>N</HostUse25>
                  <DefCurrency>N</DefCurrency>
                  <PFPWInd>N</PFPWInd>
                  <PFPQInd>N</PFPQInd>
                  <HostUse29>N</HostUse29>
                  <HostUse30>N</HostUse30>
                  <HostUse31>N</HostUse31>
                  <HostUse32>N</HostUse32>
                  <HostUse33>N</HostUse33>
                  <CurrencyQual>
                    <CalcFZINUCInd>N</CalcFZINUCInd>
                    <Spare6>NNNN</Spare6>
                    <TableDispInd>Y</TableDispInd>
                    <Spare7>NN</Spare7>
                    <Spare8>NNNNNNNN</Spare8>
                  </CurrencyQual>
                </QueryHeader>
                <CurrencyConversion>
                  <UniqueKey>0000</UniqueKey>
                  <LineNum>000</LineNum>
                  <CountryRateTables>N</CountryRateTables>
                  <AgainstCRTLocation>N</AgainstCRTLocation>
                  <CityCurrency>N</CityCurrency>
                  <RateBetweenToFrom>N</RateBetweenToFrom>
                  <IATAFZC>N</IATAFZC>
                  <IATAFZI>N</IATAFZI>
                  <UseIATARates>N</UseIATARates>
                  <Spare>N</Spare>
                  <SellersTableFZS>Y</SellersTableFZS>
                  <FZNoRounding>N</FZNoRounding>
                  <MultFactorPresent>N</MultFactorPresent>
                  <DivFactorPresent>N</DivFactorPresent>
                  <FZIAllEntry>N</FZIAllEntry>
                  <FZBuyersTable>N</FZBuyersTable>
                  <FZAuditTrail>N</FZAuditTrail>
                  <RateBetweenCurrencies>N</RateBetweenCurrencies>
                  <Country />
                  <FromCurrency>${FromCurrency}</FromCurrency>
                  <ToCurrency>${ToCurrency}</ToCurrency>
                  <CRTCurrency />
                  <Amt>${Amt}</Amt>
                  <City>N</City>
                  <SpecBankRate><![CDATA[        ]]></SpecBankRate>
                  <DispDt><![CDATA[        ]]></DispDt>
                  <AuditTrailDispDt><![CDATA[        ]]></AuditTrailDispDt>
                </CurrencyConversion>
              </FareDisplayMods>
            </FareQuoteMultiDisplay_12>
          </Transaction>
        </Request>`;
    }

    let CurrencyQueue = req.body.from.match(/\w{3}/ig);
    let CurrencyTo = req.body.to || 'THB';
    let Amt = req.body.amt || 1;
    let options = { 
      method: 'POST',
      url: 'https://apac.webservices.travelport.com/B2BGateway/service/XMLSelect',
      auth: { user: gdUsername, pass: gdPassword },
      headers: { 'cache-control': 'no-cache', 'content-type': 'text/xml; charset=utf-8' },
      body: `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:hs="http://webservices.galileo.com/">
          <soapenv:Body>
            <hs:MultiSubmitXml>
              <hs:Profile>${gdProfile}</hs:Profile>
              <hs:Requests>
                <Requests>
                  ${ CurrencyQueue.map(function(id, CurrencyTo, Amt){ return bodyRequest(id) }).join('')}
                </Requests>   
              </hs:Requests>
            </hs:MultiSubmitXml>
          </soapenv:Body>
        </soapenv:Envelope>
      `
    }

    request(options, function (error, response, body) {
      if (error && !CurrencyQueue) {
        res.writeHead(404);
        res.end();
      } else { // 24AUG 02:00 AM
        let msg = (body.match(/<OutputMsg><Text><!\[CDATA\[([\w\W]+?)]]><\/Text><\/OutputMsg>/gi) || []).map(function(OutputMsg){
          let currency = /RATES LAST UPDATED(.*?)\r[\w\W]+?BANK SELLING RATE.*?(\d+?)(\w{3}).EQUALS.*?([\.\d]+)/ig.exec(OutputMsg);
          if(currency) return { 
            updated: moment(currency[1].trim(), 'DDMMM hh:mm a').format('YYYY-MM-DD HH:mm:ss:SSS'), 
            currency: currency[3].trim(), 
            rate: parseFloat(currency[4].trim()) 
          }
        }).filter(function(item){ return item ? true : false });

        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify(msg));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
}