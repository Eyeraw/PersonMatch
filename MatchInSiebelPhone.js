function MatchInSiebelPhone(Inputs:PropertySet, sThreshold:String, Outputs:PropertySet)
{
	/*
		DAVRAMENKO 02.07.2020
		BR-20570
		Поиск клиента по номеру телефона среди всех (клиенты и проспекты). 
	*/
	try
	{
		var oBusObj = TheApplication().GetBusObject("Contact");
		var oBusComp = oBusObj.GetBusComp("Alternate Phone");
		var sSearch1:String = new String;
		var sSearch2:String = new String; 
		var sTemp:String = new String;
		var OutMatchScore;
		var i;
		var iNum:Number;
		var isRecord;
		var sToday = new Date(); //##DAVRAMENKO 06.07.2020 Текущая дата
        var sNow = "01/01/2012"; //##DAVRAMENKO 06.07.2020 Переменная для хранения даты в нужном нам формате.
        var sYear = sToday.getUTCFullYear(); //##DAVRAMENKO 06.07.2020 Получаем год в UTC
        var sMonth = sToday.getUTCMonth() + 1; //##DAVRAMENKO 06.07.2020 Получаем месяц в UTC
        if (sMonth < 10) 
		{
			sMonth = "0" + sMonth; //##DAVRAMENKO 06.07.2020 Добавляем 0 к началу месяца
		} 
        var sDate = sToday.getUTCDate(); //##DAVRAMENKO 06.07.2020 Получаем день в UTC
        if (sDate < 10) 
		{
			sDate = "0" + sDate; //##DAVRAMENKO 06.07.2020 Добавляем 0 к началу дня
		}
        sNow = sMonth + "/" + sDate + "/" + sYear;
		var oFindedPS = TheApplication().NewPropertySet();
			
		OutMatchScore = 99;
		with(oBusComp)
		{
			InvokeMethod("SetAdminMode","TRUE");
			ActivateField("Person Id");
			ClearToQuery();
			SetSearchExpr("[Address] = '" + Inputs.GetProperty("MDM DQ FullPhone") + "' AND [Medium Type] = 'Phone' AND ([Effective End Date] > '" + sNow + "' OR [Effective End Date] IS NULL)"); //##DAVRAMENKO 06.07.2020 Поиск по номеру телефона с условием того что дата окончания должна быть больше текущей или пустой.
			ExecuteQuery(ForwardOnly);                
			iNum = CountRecords();
			isRecord = FirstRecord();
			oFindedPS.SetType("FindedMatch");
			if (iNum > 10) //##DAVRAMENKO 06.07.2020 Ограничиваем количество найденных записей 10-ю
				iNum = 10;
			i = 0;
			while (isRecord && i < 10)
			{
				if (sSearch1.indexOf(GetFieldValue("Person Id"))== -1)//##DAVRAMENKO 10.07.2020 Добавляем в серч только уникальные id контактов
				{
					sTemp = "";
                    
					oFindedPS.SetProperty(GetFieldValue("Person Id"), OutMatchScore);
					sTemp = "[Contact.Id]='" + GetFieldValue("Person Id") + "'";
					if (sSearch1.length + sTemp.length + 4 < 2000)
					{
						// Если добавляем не первый раз, то через OR
						if (sSearch1.length > 0)
						{
							sSearch1 = sSearch1 + " OR " + sTemp;
						}
						// Иначе, первый раз
						else
						{
							sSearch1 = sTemp;
						}
					}
					// Если лимит в sSearchExpr1 превышен, то добавляем Id в sSearchExp2
					// также с проверкой лимита в 2000 символов
					else if (sSearch2.length + sTemp.length + 4 < 2000)
					{
						if (sSearch2.length > 0)
						{
							sSearch2 = sSearch2 + " OR " + sTemp;
						}
						else
						{
							sSearch2 = sTemp;
						}
					}
					isRecord = NextRecord();
					i = i + 1;
				}
				else
				{
				isRecord = NextRecord();
				}
			}
		}
		Outputs.AddChild(oFindedPS);
		Outputs.SetProperty("sSearchExp1",sSearch1);
		Outputs.SetProperty("sSearchExp2",sSearch2);
		Outputs.SetProperty("iCount",iNum); 
	}
	catch(e)
	{
		throw(e)
	}
	finally
	{
		oFindedPS = null;
		sDate = null;
		sMonth = null;
		sYear = null;
		sNow = null;
		sToday = null;
		isRecord = null;
		iNum = null;
		i = null;
		OutMatchScore = null;
		sTemp = null;
		sSearch2 = null;
		sSearch1 = null;
		oBusComp = null;
		oBusObj = null;
	}
}