// **********
// Описание: Метод реализует вызов сервиса нечеткого поиска
// ДИ с УСБС GR 6.4.11 ReqId 925
// Автор(ы): Филатова Мария
// Компания: Техносерв Консалтинг
// Дата: 18/10/2012 
// **********
function PersonMatch (Inputs, Outputs)
{ 
	try
	{
		//logPropSet(Inputs,"Inputs.txt");
		var aStartTime = GetDate(),
			aDate = new Date,
			sMilSecStart = aDate.getTime(),
			app = TheApplication(),
			oLogBS = app.GetService("MDM Online Log Service"),	
			oDQMBS = app.GetService("UCM Data Quality Manager"), // Данный BS нужен для получения значения UP "Contact Manual Threshold", если в сообщении Threshold пуст.
			oEAITransformBS = app.GetService("EAI Data Transformation Engine"),
			oEAISiebelAdapterBS = app.GetService("EAI Siebel Adapter"), 
			oInputPS = app.NewPropertySet(),
			oOutputPS = app.NewPropertySet(),
			oInput2PS = app.NewPropertySet(),
			oOutput2PS = app.NewPropertySet(),
			oFindedMatchPS = app.NewPropertySet(), // Для хранения пар Id:Score найденных контактов
			oInputSiebelMessagePS = app.NewPropertySet(),
			oOutputSiebelMessagePS = app.NewPropertySet(),
			oLogPS = app.NewPropertySet(),
			sThreshold = new String,
			sSearchExp1 = new String,
			sSearchExp2 = new String,
			sTemp = new String,
			iCount = 0,
			iChildCount = 0,
			oSiebMsg = Inputs.GetChild(0).Copy(),
			oContactPs = oSiebMsg.GetChild(0).GetChild(0).GetChild(0).GetChild(0),
			oOutputFuncPs = app.NewPropertySet(),
			inSiebel = true,
			inSiebelMatch = true,
			inFactor = false,
			inSiebelInn = false, //ONikitushkina 14.01.2018 CR-788
			inSiebelPhone = false, //##DAVRAMENKO 06.07.2020 BR-20570
			iCandidate,
			aEndTime,
			sMilSecEnd,
			sDiffirence;
		TheApplication().SetProfileAttr("MatchPartyUId",""); //alm-95690 + OS-94771
		sThreshold = GetSystemPreference("MDM Fuzzy Contact Threshold");
		if(sThreshold == "-1" || sThreshold == null || sThreshold == ""){
			sThreshold = oSiebMsg.GetChild(0).GetChild(0).GetProperty("Threshold");
			if(sThreshold.valueOf() ==  "")
				sThreshold = oDQMBS.GetProperty("Contact Manual Threshold");

		}
		if(GetSystemPreference("MDM Match Contact in Siebel") == "TRUE")
			inSiebel = true;
		else 
			inSiebel = false;
		if(GetSystemPreference("MDM Match Contact Factor Only") == "TRUE")
			inFactor = true;
		inSiebelInn = inSiebelInnFlag(oContactPs); //ONikitushkina 15.01.2018 CR-788
		/* ##DAVRAMENKO BR-20570 Start поиск по номеру телефона */
		if(oContactPs.GetProperty("MDM Match Req Type").toLowerCase() == "phone") //IPEREZHOGIN Переделал структуру проверки. Привел к нижниму регистру.  
			inSiebelPhone = true;
		//## IPEREZHOGIN RDS-1236  Поиск по Номеру телефона, ИНН, Хеш СНИЛС, Хеш паспорта
		if(oContactPs.GetProperty("MDM Match Req Type").toLowerCase() == "fid"){
			MatchInSiebelFid(oContactPs, oOutputFuncPs);
			oFindedMatchPS = oOutputFuncPs.GetChild(0).Copy();
			iCount = ToNumber(oOutputFuncPs.GetProperty("iCount"));
			sSearchExp1 = oOutputFuncPs.GetProperty("sSearchExp1");
		}
		else {	
			if(inSiebelPhone == true){
				MatchInSiebelPhone(oContactPs, sThreshold, oOutputFuncPs);
				oFindedMatchPS = oOutputFuncPs.GetChild(0).Copy();
				iCount = ToNumber(oOutputFuncPs.GetProperty("iCount")); 
				sSearchExp1 = oOutputFuncPs.GetProperty("sSearchExp1");
				sSearchExp2 = oOutputFuncPs.GetProperty("sSearchExp2");
			}
			/* ##DAVRAMENKO BR-20570 End */
			else{
				if(inSiebelInn == true){
					//CR-788
					MatchInSiebelINN(oContactPs, sThreshold, oOutputFuncPs);
					oFindedMatchPS = oOutputFuncPs.GetChild(0).Copy();
					iCount = ToNumber(oOutputFuncPs.GetProperty("iCount")); 
					sSearchExp1 = oOutputFuncPs.GetProperty("sSearchExp1");
					sSearchExp2 = oOutputFuncPs.GetProperty("sSearchExp2");
				}
				else{
					if(inSiebel == true){
						MatchInSiebel(oContactPs, sThreshold, oOutputFuncPs);
						oFindedMatchPS = oOutputFuncPs.GetChild(0).Copy();
						iCount = ToNumber(oOutputFuncPs.GetProperty("iCount")); 
						sSearchExp1 = oOutputFuncPs.GetProperty("sSearchExp1");
						sSearchExp2 = oOutputFuncPs.GetProperty("sSearchExp2");
					}
					else{
						if(inFactor == true){ //VTB24DPR3-83 проверка только в факторе
							MatchInFactor(oContactPs, sThreshold, oOutputPS);
							iCount = oOutputPS.GetChildCount();
							inSiebelMatch = false;
						}
						else{//BR-14476 -> поиск по ФИО+ДР+ДУЛ, при совпадении<99% - проверка в факторе для нечеткого поиска, иначе - только поиск в МДМ
							MatchInSiebel(oContactPs, GetSystemPreference("MDM Fuzzy Narrow SS Threshold"), oOutputFuncPs);  
							oFindedMatchPS = oOutputFuncPs.GetChild(0).Copy();
							iCount = ToNumber(oOutputFuncPs.GetProperty("iCount")); 
							sSearchExp1 = oOutputFuncPs.GetProperty("sSearchExp1");
							sSearchExp2 = oOutputFuncPs.GetProperty("sSearchExp2");
							if(iCount == 0){
								inSiebelMatch = false;
								MatchInFactor(oContactPs, sThreshold, oOutputPS);
								iCount = oOutputPS.GetChildCount();
							}
						}
					}
				}
			}
		}
		// Если найдена хотя бы одна запись
		if(iCount > 0){
			if(inSiebel == false && inSiebelInn == false && inSiebelMatch == false && inSiebelPhone == false){ //ONikitushkina 15.01.2018 CR-788
				// Обрабатываем первые 50
				if(iCount > 50)
					iCount = 50;
				for(var i = 0; i < iCount; i++){
					// Добавляем пару Id:Score в property set для удобства переноса Match Score в выходной IO
					sTemp = "";
					oFindedMatchPS.SetProperty(oOutputPS.GetChild(0).GetChild(0).GetChild(i).GetProperty("Id"), oOutputPS.GetChild(0).GetChild(0).GetChild(i).GetProperty("Score"));
					sTemp = "[Contact.Id]='" + oOutputPS.GetChild(0).GetChild(0).GetChild(i).GetProperty("Id") + "'";				
					// Если длина Search Expression > 2000 символов
					// то добавляем данный Id
					if(sSearchExp1.length + sTemp.length + 4 < 2000){
						// Если добавляем не первый раз, то через OR
						if(sSearchExp1.length > 0)
							sSearchExp1 = sSearchExp1 + " OR " + sTemp;
						// Иначе, первый раз
						else
							sSearchExp1 = sTemp;
					}
					// Если лимит в sSearchExpr1 превышен, то добавляем Id в sSearchExp2
					else if(sSearchExp2.length + sTemp.length + 4 < 2000){
						if (sSearchExp2.length > 0)
							sSearchExp2 = sSearchExp2 + " OR " + sTemp;
						else
							sSearchExp2 = sTemp;
					}
				}
			}
			oInputPS.Reset();
			oOutputPS.Reset();
			oInputPS.SetProperty("SearchSpec", sSearchExp1.valueOf());
			oInputPS.SetProperty("OutputIntObjectName", "MDMContactMatchSearch");
			oEAISiebelAdapterBS.InvokeMethod("Query", oInputPS, oOutputPS);
			// Если все Id не вместились в sSearchExp1, то выполняем второй запрос
			if(sSearchExp2.length > 0){
				oInput2PS.SetProperty("SearchSpec", sSearchExp2.valueOf());
				oInput2PS.SetProperty("OutputIntObjectName", "MDMContactMatchSearch");
				oEAISiebelAdapterBS.InvokeMethod("Query", oInput2PS, oOutput2PS);
				// И добавляем результаты второго запроса к результатам первого
				if(oOutput2PS.GetProperty("NumOutputObjects") > 0){
					if(oOutputPS.GetProperty("NumOutputObjects") > 0){
						iCount = oOutput2PS.GetChild(0).GetChild(0).GetChildCount();
						for(var j=0; j < iCount; j++){
							oOutputPS.GetChild(0).GetChild(0).AddChild(oOutput2PS.GetChild(0).GetChild(0).GetChild(j));
						}
						oOutputPS.SetProperty("NumOutputObjects", ToNumber(oOutputPS.GetProperty("NumOutputObjects")) + ToNumber(oOutput2PS.GetProperty("NumOutputObjects")));
					}
					else{
						oOutputPS.GetChild(0).RemoveChild(0);
						oOutputPS.GetChild(0).AddChild(oOutput2PS.GetChild(0).GetChild(0));
						oOutputPS.SetProperty("NumOutputObjects", oOutput2PS.GetProperty("NumOutputObjects"));
					}
				}
			}
			//Если Siebel Adapter вернул хотя бы один контакт 
			if(oOutputPS.GetProperty("NumOutputObjects") > 0){
				// Запускаем Data Map для преобразования результатов к формату выходного IO
				oInput2PS.Reset();
				oOutput2PS.Reset();
				with(oInput2PS){
					SetProperty("MapName", "MDMContactMatch");
					SetProperty("OutputIntObjectName", "SwiPersonMatchOutputIO");
					SetProperty("Birth Date", oContactPs.GetProperty("BirthDate"));
					SetProperty("Last Name", oContactPs.GetProperty("LastName"));
					SetProperty("First Name", oContactPs.GetProperty("FirstName"));
					if(oContactPs.GetProperty("MiddleName") != "")
						SetProperty("Middle Name", oContactPs.GetProperty("MiddleName"));
					SetProperty("MDM DQ Apartment Number", oContactPs.GetProperty("MDM DQ Apartment Number"));
					SetProperty("MDM DQ Building", oContactPs.GetProperty("MDM DQ Building"));
					SetProperty("MDM DQ City", oContactPs.GetProperty("MDM DQ City"));
					SetProperty("MDM DQ Country", oContactPs.GetProperty("MDM DQ Country"));
					SetProperty("MDM DQ District", oContactPs.GetProperty("MDM DQ District"));
					SetProperty("MDM DQ Doc Number", oContactPs.GetProperty("MDM DQ Doc Number"));
					SetProperty("MDM DQ Doc Series", oContactPs.GetProperty("MDM DQ Doc Series"));
					SetProperty("MDM DQ Full Address", oContactPs.GetProperty("MDM DQ Full Address"));
					SetProperty("MDM DQ Email", oContactPs.GetProperty("MDM DQ Email"));
					SetProperty("MDM DQ FullPhone", oContactPs.GetProperty("MDM DQ FullPhone"));
					SetProperty("MDM DQ House", oContactPs.GetProperty("MDM DQ House"));
					SetProperty("MDM DQ Housing", oContactPs.GetProperty("MDM DQ Housing"));
					SetProperty("MDM DQ Postal Code", oContactPs.GetProperty("MDM DQ Postal Code"));
					SetProperty("MDM DQ Region", oContactPs.GetProperty("MDM DQ Region"));
					SetProperty("MDM DQ Settlement", oContactPs.GetProperty("MDM DQ Settlement"));
					SetProperty("MDM DQ State", oContactPs.GetProperty("MDM DQ State"));
					SetProperty("MDM DQ Street", oContactPs.GetProperty("MDM DQ Street"));
					SetProperty("MDM INN", oContactPs.GetProperty("MDM INN"));
					SetProperty("MDM DQ Doc Type", oContactPs.GetProperty("MDM DQ Doc Type"));
					SetProperty("MDM DQ Doc Issue Date", oContactPs.GetProperty("MDM DQ Doc Issue Date"));
					SetProperty("MDM Match Req Type", oContactPs.GetProperty("MDM Match Req Type"));
					AddChild(oOutputPS.GetChild(0));
				}
				oEAITransformBS.InvokeMethod("Execute", oInput2PS, oOutput2PS);
				// Избавляемся от "эха" после DataMap
				iCount = oOutput2PS.GetChild(0).GetChild(0).GetChildCount();
				for(j = 0; j < iCount; j++){
					if(j == "0"){
						for(var k = 0; k < oOutput2PS.GetChild(0).GetChild(0).GetChild(0).GetChild(0).GetChild(0).GetChildCount(); k++){
							if(oOutput2PS.GetChild(0).GetChild(0).GetChild(0).GetChild(0).GetChild(0).GetChild(k).GetType() == "ListOfCandidate")
								iCandidate = k;	
						}
					}
					else{
						for(k = 0; k < oOutput2PS.GetChild(0).GetChild(0).GetChild(j).GetChild(0).GetChild(0).GetChildCount(); k++){
							if(oOutput2PS.GetChild(0).GetChild(0).GetChild(j).GetChild(0).GetChild(0).GetChild(k).GetType() == "ListOfCandidate")
								oOutput2PS.GetChild(0).GetChild(0).GetChild(0).GetChild(0).GetChild(0).GetChild(iCandidate).AddChild(oOutput2PS.GetChild(0).GetChild(0).GetChild(j).GetChild(0).GetChild(0).GetChild(k).GetChild(0).Copy());
						}
					}
				}
				for(j = 1; j < iCount; j++){
					oOutput2PS.GetChild(0).GetChild(0).RemoveChild(1);
				}
				// Заполняем MatchScore у контактов
			 	iChildCount = oOutput2PS.GetChild(0).GetChild(0).GetChild(0).GetChild(0).GetChild(0).GetChildCount();
			 	for(var p = 0; p < iChildCount; p++){
				 	if(oOutput2PS.GetChild(0).GetChild(0).GetChild(0).GetChild(0).GetChild(0).GetChild(p).GetType() == "ListOfCandidate"){
					 	iCount = oOutput2PS.GetChild(0).GetChild(0).GetChild(0).GetChild(0).GetChild(0).GetChild(p).GetChildCount();
						for(j = 0; j < iCount; j++){
							with(oOutput2PS.GetChild(0).GetChild(0).GetChild(0).GetChild(0).GetChild(0).GetChild(p).GetChild(j)){
								SetProperty("MatchScore", oFindedMatchPS.GetProperty(GetProperty("MatchScore")));
							}
						}
					}
				}
			}
			else{//Формируем пустой ответ
				oOutput2PS.Reset();
				CreateEmptyRespone(oContactPs, oOutput2PS);
			}
		}
		else{//Формируем пустой ответ
			oOutput2PS.Reset();
			CreateEmptyRespone(oContactPs, oOutput2PS);
		}
		aEndTime = GetDate();
		aDate = new Date;
		sMilSecEnd = aDate.getTime();
		sDiffirence = sMilSecEnd-sMilSecStart;
		oLogPS.Reset();
		oInputSiebelMessagePS.Reset();
		oOutputSiebelMessagePS.Reset();
		oInputSiebelMessagePS = Inputs.GetChild(0).Copy();
		oInputSiebelMessagePS.SetType("InputSiebelMessage_IntObj");
		oOutputSiebelMessagePS = oOutput2PS.GetChild(0).Copy();
		oOutputSiebelMessagePS.SetType("OutputSiebelMessage_IntObj");
		oLogPS.AddChild(oOutputSiebelMessagePS);
		oLogPS.AddChild(oInputSiebelMessagePS);
		oLogPS.SetProperty("PointName", "Onl.Person.Match");
		oLogPS.SetProperty("Status", "Успех");
		oLogPS.SetProperty("Start Time", aStartTime);
		oLogPS.SetProperty("End Time", aEndTime);
		oLogPS.SetProperty("Difference", sDiffirence);
		oLogBS.InvokeMethod("LogOk_IntObj_IntObj", oLogPS, oOutputPS);
		oOutput2PS.GetChild(0).SetType("SiebelMessage");
		Outputs.AddChild(oOutput2PS.GetChild(0));
	}
	catch(e)
	{
		oLogPS.Reset();
		oInputSiebelMessagePS.Reset();
		oInputSiebelMessagePS = Inputs.GetChild(0).Copy();
		oInputSiebelMessagePS.SetType("InputSiebelMessage_IntObj");
		oLogPS.AddChild(oInputSiebelMessagePS);
		oLogPS.SetProperty("Status", "Ошибка");
		oLogPS.SetProperty("Error Type", "Внутренняя");
		oLogPS.SetProperty("Error Code", e.errCode);
		oLogPS.SetProperty("Error Message", e.message);
		oLogPS.SetProperty("Start Time", aStartTime);
		oLogPS.SetProperty("MilSecStart", sMilSecStart);
		oLogPS.SetProperty("Point Name", "Onl.Person.Match");
		oLogBS.InvokeMethod("LogError_IntObj", oLogPS, oOutputPS);
	}
	finally
	{
		inSiebelPhone = inSiebelInn = iCandidate = oLogBS = oDQMBS = oEAITransformBS = oDeDupBS = oEAISiebelAdapterBS = oInputPS = oOutputPS = oInput2PS = oOutput2PS = oAdapterPS = oMatchValuesPS = oFindedMatchPS  = oInputSiebelMessagePS = oOutputSiebelMessagePS = oOutputFuncPs = oLogPS = sThreshold = sSearchExp1 = sSearchExp2 = sTemp = iCount = iChildCount = oSiebMsg = oContactPs = inSiebel = inSiebelMatch = inFactor = aStartTime = aDate = sMilSecStart = aEndTime = sMilSecEnd = sDiffirence = app = null;
	}
}