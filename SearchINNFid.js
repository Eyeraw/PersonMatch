// **********
// Описание: Поиск клиента по ИНН.
// ДИ с УСБС GR 6.4.11 ReqId 925
// Автор(ы): Пережогин Илья
// Компания: Техносерв Консалтинг
// Дата: 28/05/2021 
// **********
function SearchINNFid(sINN){
	var	arrINNConId = [],
		sPerIdList = "",
		sPerId = "";
	try {
		with(TheApplication().GetBusObject("Contact").GetBusComp("Contact")){
			SetSearchExpr("[MDM INN] = '" + sINN + "'");
			ExecuteQuery(ForwardOnly);
			if(FirstRecord()){
				do {
					sPerId = GetFieldValue("Id");
					if (sPerIdList.indexOf(sPerId) == -1)
						sPerIdList += (sPerIdList.length > 0 ? ",'" : "'") + sPerId + "'"; //Кавычки добавляются , для возможности использования метода 'concate'
				} while (NextRecord());
				arrINNConId = sPerIdList.split(",");
			}
		}
	}
	finally{
		sPerId = sPerIdList = null;
	}
	return(arrINNConId);
}