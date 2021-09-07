// **********
// Описание: Поиск клиента по Хэш Паспорта и Хэш СНИЛС.
// ДИ с УСБС GR 6.4.11 ReqId 925
// Автор(ы): Пережогин Илья
// Компания: Техносерв Консалтинг
// Дата: 28/05/2021 
// **********
function SearchHashFid(sHash,docType){

	var	arrDULConId = [],
		sDULConIdList = "",
		sDULConId = "";
	try
	{
		with(TheApplication().GetBusObject("PUB Immigration Credentials").GetBusComp("PUB Contact Credential")){
				SetSearchExpr("[MDM Hash] = '" + sHash + "' AND [Category] = '" + docType + "'");
			ExecuteQuery(ForwardOnly); 
			if(FirstRecord()){
				do {
					sDULConId = GetFieldValue("Contact Id");
					if (sDULConIdList.indexOf(sDULConId) == -1)
						sDULConIdList += (sDULConIdList.length > 0 ? ",'" : "'") + sDULConId + "'"; //Кавычки добавляются , для возможности использования метода 'concate'
				} while (NextRecord());
				arrDULConId = sDULConIdList.split(",");
			}
		}
	}
	finally
	{
		sDULConId = sDULConIdList = null;
	}
	return(arrDULConId);
}