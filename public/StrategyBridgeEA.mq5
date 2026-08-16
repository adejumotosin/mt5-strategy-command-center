//+------------------------------------------------------------------+
//|                                              StrategyBridgeEA.mq5 |
//|                     Read-only bridge for Sentry Trading Command OS|
//+------------------------------------------------------------------+
#property copyright "Oluwatosin Adejumo"
#property version   "1.00"
#property strict
#property description "Read-only USTEC and EURGBP bridge. This EA never places or modifies trades."

input string DashboardUrl      = "https://your-dashboard.vercel.app";
input string BridgeToken       = "";
input string USTECSymbol       = "USTEC";
input string EURGBPSymbol      = "EURGBP";
input int    HeartbeatSeconds  = 10;
input int    SnapshotSeconds   = 5;
input int    RequestTimeoutMs  = 2500;

datetime next_heartbeat = 0;
datetime next_snapshot  = 0;
string   pending_deal   = "";

string JsonEscape(string value)
  {
   StringReplace(value,"\\","\\\\");
   StringReplace(value,"\"","\\\"");
   StringReplace(value,"\r","\\r");
   StringReplace(value,"\n","\\n");
   return value;
  }

string ApiUrl(string path)
  {
   string base=DashboardUrl;
   while(StringLen(base)>0 && StringSubstr(base,StringLen(base)-1,1)=="/")
      base=StringSubstr(base,0,StringLen(base)-1);
   return base+path;
  }

bool PostJson(string path,string payload)
  {
   if(StringLen(BridgeToken)<16)
     {
      Print("Sentry bridge: BridgeToken must contain at least 16 characters.");
      return false;
     }

   string headers="Content-Type: application/json\r\nAuthorization: Bearer "+BridgeToken+"\r\n";
   char data[];
   char result[];
   string response_headers;
   int bytes=StringToCharArray(payload,data,0,WHOLE_ARRAY,CP_UTF8);
   if(bytes>0)
      ArrayResize(data,bytes-1);

   ResetLastError();
   int status=WebRequest("POST",ApiUrl(path),headers,RequestTimeoutMs,data,result,response_headers);
   if(status==-1)
     {
      PrintFormat("Sentry bridge WebRequest failed. Error %d. Add %s to MT5 allowed URLs.",GetLastError(),DashboardUrl);
      return false;
     }

   if(status<200 || status>=300)
     {
      string response=CharArrayToString(result,0,-1,CP_UTF8);
      PrintFormat("Sentry bridge API returned HTTP %d: %s",status,response);
      return false;
     }
   return true;
  }

string IsoTime(datetime value)
  {
   MqlDateTime parts;
   TimeToStruct(value,parts);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",parts.year,parts.mon,parts.day,parts.hour,parts.min,parts.sec);
  }

string Number(double value,int digits=8)
  {
   return DoubleToString(value,digits);
  }

string SymbolJson(string symbol)
  {
   MqlTick tick;
   if(!SymbolInfoTick(symbol,tick))
      return "";

   int digits=(int)SymbolInfoInteger(symbol,SYMBOL_DIGITS);
   return "{"
      "\"name\":\""+JsonEscape(symbol)+"\","+
      "\"bid\":"+Number(tick.bid,digits)+","+
      "\"ask\":"+Number(tick.ask,digits)+","+
      "\"point\":"+Number(SymbolInfoDouble(symbol,SYMBOL_POINT),digits)+","+
      "\"tickSize\":"+Number(SymbolInfoDouble(symbol,SYMBOL_TRADE_TICK_SIZE),digits)+","+
      "\"tickValue\":"+Number(SymbolInfoDouble(symbol,SYMBOL_TRADE_TICK_VALUE),8)+","+
      "\"volumeMin\":"+Number(SymbolInfoDouble(symbol,SYMBOL_VOLUME_MIN),2)+","+
      "\"volumeMax\":"+Number(SymbolInfoDouble(symbol,SYMBOL_VOLUME_MAX),2)+","+
      "\"volumeStep\":"+Number(SymbolInfoDouble(symbol,SYMBOL_VOLUME_STEP),2)+
      "}";
  }

bool EnsureSymbols()
  {
   bool ustec=SymbolSelect(USTECSymbol,true);
   bool eurgbp=SymbolSelect(EURGBPSymbol,true);
   if(!ustec) PrintFormat("Sentry bridge: symbol %s was not found.",USTECSymbol);
   if(!eurgbp) PrintFormat("Sentry bridge: symbol %s was not found.",EURGBPSymbol);
   return ustec && eurgbp;
  }

void SendHeartbeat()
  {
   string ustec=SymbolJson(USTECSymbol);
   string eurgbp=SymbolJson(EURGBPSymbol);
   if(StringLen(ustec)==0 || StringLen(eurgbp)==0)
      return;

   string payload="{"
      "\"accountId\":\""+(string)AccountInfoInteger(ACCOUNT_LOGIN)+"\","+
      "\"server\":\""+JsonEscape(AccountInfoString(ACCOUNT_SERVER))+"\","+
      "\"currency\":\""+JsonEscape(AccountInfoString(ACCOUNT_CURRENCY))+"\","+
      "\"balance\":"+Number(AccountInfoDouble(ACCOUNT_BALANCE),2)+","+
      "\"equity\":"+Number(AccountInfoDouble(ACCOUNT_EQUITY),2)+","+
      "\"marginFree\":"+Number(AccountInfoDouble(ACCOUNT_MARGIN_FREE),2)+","+
      "\"serverTime\":\""+IsoTime(TimeTradeServer())+"\","+
      "\"symbols\":["+ustec+","+eurgbp+"]"
      "}";
   PostJson("/api/mt5/heartbeat",payload);
  }

void SendSnapshot()
  {
   string ustec=SymbolJson(USTECSymbol);
   string eurgbp=SymbolJson(EURGBPSymbol);
   if(StringLen(ustec)==0 || StringLen(eurgbp)==0)
      return;

   string payload="{"
      "\"sentAt\":\""+IsoTime(TimeGMT())+"\","+
      "\"symbols\":["+ustec+","+eurgbp+"]"
      "}";
   PostJson("/api/mt5/snapshot",payload);
  }

string DealJson(ulong deal_ticket)
  {
   if(!HistoryDealSelect(deal_ticket))
      return "";

   string symbol=HistoryDealGetString(deal_ticket,DEAL_SYMBOL);
   int digits=(int)SymbolInfoInteger(symbol,SYMBOL_DIGITS);
   return "{"
      "\"ticket\":\""+(string)deal_ticket+"\","+
      "\"order\":\""+(string)HistoryDealGetInteger(deal_ticket,DEAL_ORDER)+"\","+
      "\"positionId\":\""+(string)HistoryDealGetInteger(deal_ticket,DEAL_POSITION_ID)+"\","+
      "\"symbol\":\""+JsonEscape(symbol)+"\","+
      "\"type\":"+(string)HistoryDealGetInteger(deal_ticket,DEAL_TYPE)+","+
      "\"entry\":"+(string)HistoryDealGetInteger(deal_ticket,DEAL_ENTRY)+","+
      "\"volume\":"+Number(HistoryDealGetDouble(deal_ticket,DEAL_VOLUME),2)+","+
      "\"price\":"+Number(HistoryDealGetDouble(deal_ticket,DEAL_PRICE),digits)+","+
      "\"profit\":"+Number(HistoryDealGetDouble(deal_ticket,DEAL_PROFIT),2)+","+
      "\"commission\":"+Number(HistoryDealGetDouble(deal_ticket,DEAL_COMMISSION),2)+","+
      "\"swap\":"+Number(HistoryDealGetDouble(deal_ticket,DEAL_SWAP),2)+","+
      "\"time\":\""+IsoTime((datetime)HistoryDealGetInteger(deal_ticket,DEAL_TIME))+"\","+
      "\"comment\":\""+JsonEscape(HistoryDealGetString(deal_ticket,DEAL_COMMENT))+"\""
      "}";
  }

int OnInit()
  {
   if(MQLInfoInteger(MQL_TESTER))
     {
      Print("StrategyBridgeEA is a live read-only connector and does not run in Strategy Tester.");
      return INIT_FAILED;
     }
   if(StringLen(DashboardUrl)<8 || StringLen(BridgeToken)<16)
     {
      Print("Sentry bridge: configure DashboardUrl and a BridgeToken of at least 16 characters.");
      return INIT_PARAMETERS_INCORRECT;
     }
   if(!EnsureSymbols())
      return INIT_FAILED;

   EventSetTimer(1);
   next_heartbeat=0;
   next_snapshot=0;
   Print("Sentry read-only bridge initialised. No trade execution functions are enabled.");
   return INIT_SUCCEEDED;
  }

void OnDeinit(const int reason)
  {
   EventKillTimer();
   PrintFormat("Sentry bridge stopped. Reason %d.",reason);
  }

void OnTimer()
  {
   datetime now=TimeLocal();
   if(now>=next_heartbeat)
     {
      SendHeartbeat();
      next_heartbeat=now+MathMax(HeartbeatSeconds,5);
     }
   if(now>=next_snapshot)
     {
      SendSnapshot();
      next_snapshot=now+MathMax(SnapshotSeconds,2);
     }
   if(StringLen(pending_deal)>0)
     {
      string payload="{\"sentAt\":\""+IsoTime(TimeGMT())+"\",\"deal\":"+pending_deal+"}";
      if(PostJson("/api/mt5/trades",payload))
         pending_deal="";
     }
  }

void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result)
  {
   if(trans.type!=TRADE_TRANSACTION_DEAL_ADD || trans.deal==0)
      return;
   string deal=DealJson(trans.deal);
   if(StringLen(deal)>0)
      pending_deal=deal;
  }
//+------------------------------------------------------------------+
