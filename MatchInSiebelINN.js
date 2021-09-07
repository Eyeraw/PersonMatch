function MatchInSiebelINN(Inputs:PropertySet, sThreshold:String, Outputs:PropertySet)
{
	/*
		ONikitushkina 14.01.2018 Old New Year
		CR-788 
		поиск по ИНН если указан только ИНН. Требования РосФинМониторинга
	*/
	try
	{
		var oBusObj = TheApplication().GetBusObject("Contact");
		var oBusComp = oBusObj.GetBusComp("Contact");
		var sSearch1:String = new String;
		var sSearch2:String = new String; 
		var sTemp:String = new String;
		var sSearchType:String = new String; //какой поиск производить
		var OutMatchScore; //соответствие
		var i;
		var iNum:Number;
		var isRecord;
		var oFindedPS = TheApplication().NewPropertySet();
		var oOutputPS = TheApplication().NewPropertySet();//OBAYDA OS-42824 29.08.2016
		
		if (Inputs.GetProperty("MDM Match Req Type") != "")
			sSearchType = Inputs.GetProperty("MDM Match Req Type");
		else
			sSearchType = "cust"; 
		OutMatchScore = 99;
		with(oBusComp)
		{
			InvokeMethod("SetAdminMode","TRUE");
			ActivateField("MDM INN"); 
			ClearToQuery();
			if (sSearchType == "all")
			{
				SetSearchSpec("MDM INN",Inputs.GetProperty("MDM INN"));
			}
			else
			{
				//cust
				SetSearchExpr("[MDM INN] = '" + Inputs.GetProperty("MDM INN") + "' AND [Type] <> '3'");
			}
			ExecuteQuery(ForwardOnly);                
			iNum = CountRecords();
			isRecord = FirstRecord();
			oFindedPS.SetType("FindedMatch");
			if (iNum > 50) 
				iNum = 50;
			i = 0;
			while (isRecord)
			{
				sTemp = "";
				oFindedPS.SetProperty(GetFieldValue("Id"), OutMatchScore);
				sTemp = "[Contact.Id]='" + GetFieldValue("Id") + "'";
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
		OutMatchScore = null;
		sSearchType = null;
		i = null;
		isRecord = null;
		iNum = null;
		oFindedPS = null;
		oOutputPS = null;
		sTemp = null;
		sSearch2 = null;
		sSearch1 = null;
		oBusComp = null;
		oBusObj = null;
	}
}