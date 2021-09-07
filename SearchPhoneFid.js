// **********
// Описание: Поиск клиента по номеру телефона
// ДИ с УСБС GR 6.4.11 ReqId 925
// Автор(ы): Пережогин Илья
// Компания: Техносерв Консалтинг
// Дата: 28/05/2021 
// **********
function SearchPhoneFid(sPhone){
	var	arrPhoneConId = [],
		sPerIdList = "",
		sPerId = "";
	try {
		with(TheApplication().GetBusObject("MDM Verified Phone Duplicate").GetBusComp("Alternate Phone")){
			SetSearchExpr("[Address] = '" + sPhone + "' AND ([Effective End Date] > '" + InvokeMethod("EvalExpr", "Today()") + "' OR [Effective End Date] IS NULL)");
			ExecuteQuery(ForwardOnly);
			if(FirstRecord()){
				do {
					sPerId = GetFieldValue("Person Id");
					if (sPerIdList.indexOf(sPerId) == -1)
						sPerIdList += (sPerIdList.length > 0 ? ",'" : "'") + sPerId + "'"; //Кавычки добавляются , для возможности использования метода 'concate'
				} while (NextRecord());
				arrPhoneConId = sPerIdList.split(",");
			}
		}
	}
	finally{
		sPerId = sPerIdList = null;
	}
	return(arrPhoneConId);
}