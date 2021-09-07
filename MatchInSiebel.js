function MatchInSiebel(Inputs:PropertySet, sThreshold:String, Outputs:PropertySet)
{
	try
	{
		var oBusObj = TheApplication().GetBusObject("MDM EBC Search Contact");
		var oBusComp = oBusObj.GetBusComp("MDM EBC Search Contact");
		var sSearch1:String = new String;
		var sSearch2:String = new String; 
		var sTemp:String = new String;
		var oFindedPS = TheApplication().NewPropertySet();
		var oOutputPS = TheApplication().NewPropertySet();//OBAYDA OS-42824 29.08.2016

		with(oBusComp)
		{
			ActivateField("in_birth_dt"); 
			ActivateField("in_dul_num"); 
			ActivateField("in_dul_series"); 
			ActivateField("in_fst_name");
			ActivateField("in_fst_name"); 
			ActivateField("in_last_name"); 
			ActivateField("in_mid_name"); 
			ActivateField("in_search_type");
			ActivateField("input_data_flg"); 
			ActivateField("threshold");
			NewRecord(NewAfter); 
			SetFieldValue("in_birth_dt",Inputs.GetProperty("BirthDate"));
			SetFieldValue("in_dul_num",Inputs.GetProperty("MDM DQ Doc Number"));                  
	        SetFieldValue("in_dul_series",Inputs.GetProperty("MDM DQ Doc Series"));                     
			SetFieldValue("in_fst_name",Inputs.GetProperty("FirstName")); 
			SetFieldValue("in_last_name",Inputs.GetProperty("LastName"));                                 
			SetFieldValue("in_mid_name",Inputs.GetProperty("MiddleName")); 
			if (Inputs.GetProperty("MDM Match Req Type") != "")
				SetFieldValue("in_search_type", Inputs.GetProperty("MDM Match Req Type"))
			else
				SetFieldValue("in_search_type", "cust");                    
			SetFieldValue("input_data_flg","Y");
			SetFieldValue("threshold",sThreshold);
			var aDate = new Date;
			//OBAYDA OS-42824 29.08.2016 begin
			GetUID (oOutputPS);
			//OBAYDA OS-42824 29.08.2016 было var snum = aDate.getMilliseconds()+Math.round(Math.random()*100000);
			var snum = oOutputPS.GetProperty("UID");
			//OBAYDA OS-42824 29.08.2016 end
			SetFieldValue("searchnum",snum);
			WriteRecord();
			InvokeMethod("SetAdminMode","TRUE");
			ClearToQuery();
			ActivateField("input_data_flg");
			ActivateField("in_search_type");
			ActivateField("out_con_id");
			ActivateField("out_match_score");
			SetSearchSpec("input_data_flg", "N");
			SetSearchSpec("searchnum",snum);
			ExecuteQuery(ForwardOnly);
			var iNum:Number = CountRecords();
			var isRecord = FirstRecord();
			oFindedPS.SetType("FindedMatch");
			if (iNum > 50) 
				iNum = 50;
			var i = 0;
			while (isRecord)
			{
				sTemp = "";
				oFindedPS.SetProperty(GetFieldValue("out_con_id"), GetFieldValue("out_match_score"));
				sTemp = "[Contact.Id]='" + GetFieldValue("out_con_id") + "'";
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
		i = null;
		isRecord = null;
		iNum = null;
		snum = null;
		aDate = null;
		oFindedPS = null;
		oOutputPS = null;
		sTemp = null;
		sSearch2 = null;
		sSearch1 = null;
		oBusComp = null;
		oBusObj = null;
	}
}