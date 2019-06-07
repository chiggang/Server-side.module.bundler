/*
 *
 * Title: Scrubber RestAPI Server
 * Date: 2019.05.07
 *
 */



/*
 * 초기화
 */

// 모듈을 불러옴
const path = require('path');
const fileExists = require('file-exists');
const fileBytes = require('file-bytes');
// const oracledb = require('oracledb');
// oracledb.autoCommit = true;
// oracledb.outFormat = oracledb.OBJECT;

// 추가 모듈을 불러옴
// const config = require(`${__dirname}/config.module.js`);
const func = require('../function.module.js');

// 실시간 소켓 접속 주소 및 포트를 정의함
//const socketUrl = `${config.socketInfo.url}:${config.socketInfo.port}`;

// 모듈을 불러옴
// let socket = require('socket.io-client')(socketUrl);
let socket = null;



/*
 * Module 정의
 */

module.exports = (app, io, params, callback) => {
	socket = require('socket.io-client')(`${params.config.address.socket.url}:${params.config.address.socket.port}`);

	/*
	 * 외부에서 크레인 정보를 받음
	 * 총 9대의 크레인에서 각각 1초마다 데이터를 받음
	 * 예) {"craneId":"AC659","Xrange":12.75,"Y1range":17.13,"Y2range":35.09,"firLoadcell":0.0,"secLoadcell":0.0,"loadcellTotal":1.0,"auxLoadcell":1.0,"kalmanLoadcellTotal":1.0,"kalmanFirLoadcell":0.0,"kalmanSecLoadcell":0.0,"kalmanAuxLoadcell":1.0,"timestamp":1553439609000}
	 */
	app.post('/api/set/crane_state', (req, res) => {
		// 크레인 정보를 추가함
		callback({
			callType: 'CraneState',
			data: req.body,
		});

		// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
		sendData('set', res, true, null);

		// 받은 인자값을 정의함
		// const paramCol1 = req.body.col1;	// 
		// const paramCol2 = req.body.col2;	// 
		
		// // 쿼리를 정의함
		// const query = `
		// 	INSERT	INTO TEST20181024
		// 			(
		// 				N1,
		// 				N2,
		// 				N3,
		// 				N4,
		// 				N5,
		// 				N6,
		// 				REG_DTE
		// 			)
		// 	VALUES	(
		// 				${paramCol1},
		// 				${paramCol2},
		// 				0,
		// 				0,
		// 				0,
		// 				0,
		// 				'20190101'
		// 			)
		// `;

		// // 쿼리를 실행하여 데이터를 불러옴
		// const data = executeQuery('C62A', query, (resultType, data) => {
		// 	// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
		// 	sendData('set', res, resultType, data);
		// });
	});

	/*
	 * 선행안전지수 부서별 목록을 불러옴
	 */
	app.post('/api/get/safe_point', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	A.CRT_DATE,
					SUBSTR(A.CRT_DATE, 5, 2) || '.' || SUBSTR(A.CRT_DATE, 7, 2) AS CRT_DATE_MD,
					A.BSNS_CD,
					A.BSNS_NM,
					'' AS PART_CD,
					A.BSNS_NM AS PART_NM,
					A.VAL
			FROM	XS01.VSLI_BSNS_AC00 A
			INNER	JOIN (
						SELECT	CRT_DATE
						FROM	(
									SELECT	CRT_DATE
									FROM	XS01.VSLI_BSNS_AC00
									WHERE	VAL IS NOT NULL
									GROUP	BY CRT_DATE
									ORDER	BY CRT_DATE DESC
								)
						WHERE	ROWNUM = 1
					) B
					ON A.CRT_DATE = B.CRT_DATE
			UNION	ALL
			SELECT	A.CRT_DATE,
					SUBSTR(A.CRT_DATE, 5, 2) || '.' || SUBSTR(A.CRT_DATE, 7, 2) AS CRT_DATE_MD,
					A.BSNS_CD,
					'' AS BSNS_NM,
					A.PART_CD,
					A.PART_NM,
					A.VAL
			FROM	XS01.VSLI_PART_AC00 A
			INNER	JOIN (
						SELECT	CRT_DATE
						FROM	(
									SELECT	CRT_DATE
									FROM	XS01.VSLI_PART_AC00
									WHERE	VAL IS NOT NULL
									GROUP	BY CRT_DATE
									ORDER	BY CRT_DATE DESC
								)
						WHERE	ROWNUM = 1
					) B
					ON A.CRT_DATE = B.CRT_DATE
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});

	/*
	 * 선행안전지수 상세 목록을 불러옴
	 */
	app.post('/api/get/safe_point_detail', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	(POINT_RULE + POINT_ACCIDENT + POINT_EDUCATION + POINT_AWARD) AS SAFETY_IDX,	/* 선행안전지수 총점 */
					POINT_RULE,				/* 안전수칙 */
					RULE_CABSOLUTE,			/* 절대수칙 */
					RULE_CGENERAL,			/* 일반수칙 */
					RULE_CSTOP_WORK,		/* 작업중지 */
					RULE_CMUNICIPAL,		/* 시정통보 */
					POINT_ACCIDENT,			/* 안전사고 */
					ACCIDENT_CMINOR,		/* 경미사고 건수 */
					ACCIDENT_CSERIOUS,		/* 중대사고 건수 */
					ACCIDENT_CINDUSTRIAL,	/* 산재사고 건수 */
					POINT_EDUCATION,		/* 안전교육 */
					POINT_AWARD				/* 개선활동 */
			FROM	(
						SELECT	*
						FROM	XS01.VSLI_DEPT_AC00
						WHERE	DEPT_CD = 'C550'
						ORDER	BY CRT_DATE DESC
					) 
			WHERE	ROWNUM = 1
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});
		
	/*
	 * 조립공정현황 목록을 불러옴
	 */
	app.post('/api/get/construct_state', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	DISTINCT GUBUN,
					SIGN_VAL_GBN,
					COUNT(*) AS CNT
			FROM	DTM_UA1002
			WHERE	IN_DAT = TO_CHAR(SYSDATE, 'YYYYMMDD')
			GROUP	BY GUBUN,
					SIGN_VAL_GBN
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});
		
	/*
	 * 조립공정현황 상세 목록을 불러옴
	 */
	app.post('/api/get/construct_detail', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	IN_DAT,
					GUBUN,
					FIG_SHP,
					SUBSTR(ACT_COD, 1, 5) AS ITM_COD,
					ACT_COD,
					ACT_DES,
					PRE_ACT,
					PRE_ITM,
					AFT_ITM,
					DPT_COD,
					DPT_NM,
					MIS_COD,
					P3_BLK,
					P2_BLK,
					P1_BLK,
					PLN_ST,
					DECODE(PLN_ST, NULL, '', SUBSTR(PLN_ST, 1, 4) || '.' || SUBSTR(PLN_ST, 5, 2) || '.' || SUBSTR(PLN_ST, 7, 2)) AS PLN_ST_TEXT,
					PLN_FI,
					DECODE(PLN_FI, NULL, '', SUBSTR(PLN_FI, 1, 4) || '.' || SUBSTR(PLN_FI, 5, 2) || '.' || SUBSTR(PLN_FI, 7, 2)) AS PLN_FI_TEXT,
					EST_ST_PP,
					DECODE(EST_ST_PP, NULL, '', SUBSTR(EST_ST_PP, 1, 4) || '.' || SUBSTR(EST_ST_PP, 5, 2) || '.' || SUBSTR(EST_ST_PP, 7, 2)) AS EST_ST_PP_TEXT,
					EST_FI_PP,
					DECODE(EST_FI_PP, NULL, '', SUBSTR(EST_FI_PP, 1, 4) || '.' || SUBSTR(EST_FI_PP, 5, 2) || '.' || SUBSTR(EST_FI_PP, 7, 2)) AS EST_FI_PP_TEXT,
					FORECAST_ST,
					DECODE(FORECAST_ST, NULL, '', SUBSTR(FORECAST_ST, 1, 4) || '.' || SUBSTR(FORECAST_ST, 5, 2) || '.' || SUBSTR(FORECAST_ST, 7, 2)) AS FORECAST_ST_TEXT,
					FORECAST_FI,
					DECODE(FORECAST_FI, NULL, '', SUBSTR(FORECAST_FI, 1, 4) || '.' || SUBSTR(FORECAST_FI, 5, 2) || '.' || SUBSTR(FORECAST_FI, 7, 2)) AS FORECAST_FI_TEXT,
					RESULT_ST,
					DECODE(RESULT_ST, NULL, '', SUBSTR(RESULT_ST, 1, 4) || '.' || SUBSTR(RESULT_ST, 5, 2) || '.' || SUBSTR(RESULT_ST, 7, 2)) AS RESULT_ST_TEXT,
					RESULT_FI,
					DECODE(RESULT_FI, NULL, '', SUBSTR(RESULT_FI, 1, 4) || '.' || SUBSTR(RESULT_FI, 5, 2) || '.' || SUBSTR(RESULT_FI, 7, 2)) AS RESULT_FI_TEXT,
					MUL_WGT,
					SIGN_VAL,
					SIGN_VAL_GBN,
					DELAY_DATE,
					PE_SIGN_VAL,
					ASS_SIGN_VAL,
					F21_SIGN_VAL,
					G41_SIGN_VAL,
					H32_SIGN_VAL,
					PRE_ACT_DES,
					PRE_RESULT_ST,
					PRE_RESULT_FI,
					PRE_DPT_COD,
					WRKCNTR,
					WRKCNTR_NM,
					STATUS_STR
			FROM	DTM_UA1002
			WHERE	IN_DAT = TO_CHAR(SYSDATE, 'YYYYMMDD')
					AND GUBUN = '${req.body.GUBUN}'
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});

	/*
	 * 검사합격율(금월) 목록을 불러옴
	 */
	app.post('/api/get/success_point', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	GUBUN,						/* 직영구분: O: 직영, X: 외주 */
					ROUND(AVG(PERT), 0) AS PERT	/* 합격율(월 평균) */
			FROM	DTM_UA1003
			WHERE   SUBSTR(IN_DAT, 1, 6) = TO_CHAR(SYSDATE, 'YYYYMM')
			GROUP	BY GUBUN
			ORDER	BY GUBUN
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});

	/*
	 * 검사합격율(금월) 상세 목록을 불러옴
	 */
	app.post('/api/get/success_point_detail', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	A.IN_DAT,
					SUBSTR(A.IN_DAT, 1, 4) || '.' || SUBSTR(A.IN_DAT, 5, 2) AS IN_DAT_YM,
					SUBSTR(A.IN_DAT, 5, 2) AS IN_DAT_M,
					DECODE(B.PERT, NULL, 0, B.PERT) AS PERT		/* 합격율(월 평균) */
			FROM	(
						SELECT	TO_CHAR(SYSDATE, 'YYYY') || LPAD(LEVEL, 2, 0) AS IN_DAT
						FROM	DUAL
						CONNECT	BY LEVEL <= 12
					) A
			LEFT	OUTER JOIN (
						SELECT	SUBSTR(IN_DAT, 1, 6) AS IN_DAT,
								ROUND(AVG(PERT), 2) AS PERT
						FROM	DTM_UA1003
						WHERE   SUBSTR(IN_DAT, 1, 4) = TO_CHAR(SYSDATE, 'YYYY')
						GROUP	BY SUBSTR(IN_DAT, 1, 6)
						ORDER	BY IN_DAT
					) B
					ON A.IN_DAT = B.IN_DAT
			ORDER	BY A.IN_DAT
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});

	/*
	 * 검사합격율 Line QC 평가표 목록을 불러옴
	 * @IN_TYPE: I, L ,Q
	 * @V_CHECK_EMP_NO: Y
	 * @IN_DEPT: C550
	 * @IN_DISPLAY_ALL_YN: Y
	 */
	app.post('/api/get/line_qc_eval_point', (req, res) => {
		// 쿼리를 정의함
		const query = `
			with sum_data as (
				select a.department, a.dept_cd, a.sect_cd, a.applicant, a.applicant_empno,
						sum(insp_cnt_r) as insp_cnt_r,
						sum(insp_cnt) as insp_cnt,
						sum(visible_check_cnt) as visible_check_cnt,
						sum(i1_1) as i1_1,
						sum(i1_2) as i1_2,
						sum(i2) as i2,
						sum(i3) as i3,
						sum(i4) as i4,
						SUM(A.I6) AS I6,
						SUM(A.I6_RPW) AS I6_RPW,
						SUM(A.I6_CDI) AS I6_CDI,
						SUM(A.I6_ACI) AS I6_ACI,
						SUM(A.I6_AMD) AS I6_AMD,
						SUM(A.I6_ROD) AS I6_ROD,
						SUM(A.I6_ACO) AS I6_ACO,
						SUM(A.BASIC_CNT) AS BASIC_CNT,
						SUM(A.I6_A_R_CDI) AS I6_A_R_CDI,
						sum(m1) as m1,
						sum(cmt_h_cnt) as cmt_h_cnt,
						sum(cmt_f_cnt) as cmt_f_cnt,
						sum(cmt_p_cnt) as cmt_p_cnt
				from TQM_MNGT085_STORE_01 a
				inner join TQM_MNGT085_STORE_02 b
				on a.applicant = b.applicant
				and nvl(a.applicant_empno,' ') = nvl(b.applicant_empno, ' ')
				and a.real_day = b.real_day
				and nvl(a.key,' ') = nvl(b.key,' ')
				and a.real_day >= TO_CHAR(SYSDATE,'YYYYMM') || '01'
				and a.real_day <= TO_CHAR(SYSDATE,'YYYYMMDD')
				where 1=1
				AND A.KEY IN (
				SELECT TRIM(REGEXP_SUBSTR('${req.body.IN_TYPE}','[^,]+', 1, LEVEL)) FROM DUAL
				CONNECT BY REGEXP_SUBSTR('${req.body.IN_TYPE}', '[^,]+', 1, LEVEL) IS NOT NULL
						)
				and a.real_day >= TO_CHAR(SYSDATE,'YYYYMM') || '01'
				and a.real_day <= TO_CHAR(SYSDATE,'YYYYMM') || '31'
				group by a.department, a.dept_cd, a.sect_cd, a.applicant, a.applicant_empno
			), temp_data0 as (
				SELECT APPLICANT, APPLICANT_EMPNO, DEPARTMENT, SECT_CD,
				sum(insp_cnt_r) as insp_cnt_r,
				sum(insp_cnt) as insp_cnt,
				sum(visible_check_cnt) as visible_check_cnt,
				sum(i1_1) as i1_1,
				sum(i1_2) as i1_2,
				sum(i2) as i2,
				sum(i3) as i3,
				sum(i4) as i4,
	
				/* 선주불만족도 추가 I6 2018.07.11 */
				/* 선주불만족도 SUMMURY 계산을 위한 개별 합계 수량 필요 */
				SUM(B.I6) AS I6,
				SUM(B.I6_RPW) AS I6_RPW,
				SUM(B.I6_CDI) AS I6_CDI,
				SUM(B.I6_ACI) AS I6_ACI,
				SUM(B.I6_AMD) AS I6_AMD,
				SUM(B.I6_ROD) AS I6_ROD,
				SUM(B.I6_ACO) AS I6_ACO,
				SUM(B.BASIC_CNT) AS BASIC_CNT,
				SUM(B.I6_A_R_CDI) AS I6_A_R_CDI,
	
				sum(m1) as m1,
				sum(cmt_h_cnt) as cmt_h_cnt,
				sum(cmt_f_cnt) as cmt_f_cnt,
				sum(cmt_p_cnt) as cmt_p_cnt
				FROM sum_data b
				GROUP BY APPLICANT, APPLICANT_EMPNO, DEPARTMENT, SECT_CD
			), temp_data1 as (
			select
				A.DEPT_CODE, A.INOUT, 
				A.SECT_CD, A.SECT_USER_CD,
				A.TEAM_CD, A.TEAM_USER_CD, A.USER_ID, A.NAME,
				PKG_CQM003_MNGT_COM.FN_GET_TYPE_BY_DEPT_CD_2(A.DEPT_CODE) AS DEPT_TYPE,
				MAX(A.SECT_NM) AS SECT_NM,
				MAX(A.SECT_USER_NM) AS SECT_USER_NM,
				MAX(A.DEPT_NAME) AS DEPT_NAME,
				MAX(A.INOUT_NM) AS INOUT_NM,
				MAX(A.TEAM_NM) AS TEAM_NM,
				MAX(A.TEAM_USER_NM) AS TEAM_USER_NM,
				sum(insp_cnt_r) as insp_cnt_r,
				sum(insp_cnt) as insp_cnt,
				sum(visible_check_cnt) as visible_check_cnt,
				sum(i1_1) as i1_1,
				sum(i1_2) as i1_2,
				sum(i2) as i2,
				sum(i3) as i3,
				sum(i4) as i4,

				/* 선주불만족도 추가 I6 2018.07.11 */
				SUM(B.I6)     AS I6_AR,
				SUM(B.I6_RPW) AS I6_RPW,
				SUM(B.I6_CDI) AS I6_CDI,
				SUM(B.I6_ACI) AS I6_ACI,
				SUM(B.I6_AMD) AS I6_AMD,
				SUM(B.I6_ROD) AS I6_ROD,
				SUM(B.I6_ACO) AS I6_ACO,
				SUM(B.I6_A_R_CDI) AS I6_A_R_CDI,

				CASE WHEN SUM(B.I6) > 0
					THEN ROUND(((SUM(B.I6_RPW) * 1.2) +
										(SUM(B.I6_CDI) * 0.7) +
										(SUM(B.I6_ACI) * 0.5) +
										(SUM(B.I6_AMD) * 0.3) +
										(SUM(B.I6_ROD) * 0.2) +
										(SUM(B.I6_ACO) * 0.1) ) / SUM(B.I6_A_R_CDI) * 100, 1)
				ELSE 0 END AS I6, /* 선주불만족도 % */

			sum(m1) as m1,

				0 AS F1, /*  검사코멘트 건수 사용안함 2018.07.11 */
				0 AS B1, /*  검사코멘트 건수 사용안함 2018.07.11 */
				0 AS C1, /*  검사코멘트 건수 사용안함 2018.07.11 */

			/* 기초품질 로직 수정 2018.07.11 */
				NVL(SUM(B.BASIC_CNT),0) AS F2, /* 기초품질 건수 */
				0 AS B2, /* 검사코멘트 건수 사용안함 2018.07.11 */
				0 AS C2,  /* 검사코멘트 건수 사용안함 2018.07.11 */
				''
			from TQM_MNGT085_STORE_LAYOUT  a
			INNER JOIN temp_data0 B
				ON B.APPLICANT = A.NAME
				/* 2018.03.07 : LQC 부서와 검사데이터 신청부서가 다를경우 JOIN이 안됨. <- 사번으로 묶기일경우 부서를 무시하고 사번으로 묶도록 변경 */
				AND ('${req.body.V_CHECK_EMP_NO}' = 'Y' OR
					(
						CASE WHEN A.INOUT = 'O' AND B.DEPARTMENT = A.TEAM_USER_CD THEN 1
							WHEN A.INOUT = 'I' AND SUBSTR(B.SECT_CD,1,3)||'000' = SUBSTR(A.DEPT_CODE,1,3)||'000'  THEN 1
						ELSE 0
						END = 1
					)
					)
				AND ('${req.body.V_CHECK_EMP_NO}' <> 'Y' OR B.APPLICANT_EMPNO = A.USER_ID)
			WHERE 1=1
				AND ('${req.body.IN_DEPT}' IS NULL OR SUBSTR(A.DEPT_CODE,1,3)||'0' IN (SELECT TRIM(COLUMN_VALUE) FROM TABLE(PKG_CQM003_MNGT_COM.FN_GET_SPLITED_TB('${req.body.IN_DEPT}'))))
			group by A.DEPT_CODE, A.INOUT, A.SECT_CD, A.SECT_USER_CD, A.TEAM_CD, A.TEAM_USER_CD, A.USER_ID, A.NAME, PKG_CQM003_MNGT_COM.FN_GET_TYPE_BY_DEPT_CD_2(A.DEPT_CODE)
			)
			, TEMP_DATA2 AS (
					SELECT A.DEPT_CODE,A.DEPT_NAME,A.DEPT_TYPE,A.INOUT,A.INOUT_NM,A.SECT_CD,A.SECT_NM,A.SECT_USER_CD,A.SECT_USER_NM,A.TEAM_CD,A.TEAM_NM,A.TEAM_USER_CD,A.TEAM_USER_NM,A.USER_ID,A.NAME,
							VISIBLE_CHECK_CNT,
							INSP_CNT,INSP_CNT_R,
							I1_1 AS R1,
							I1_2 AS R2,
							I2   AS R3,
							I3   AS R4,
							I4   AS R5,
							M1   AS M1,
	
							I6_AR,
							I6_RPW,
													I6_CDI,
													I6_ACI,
													I6_AMD,
													I6_ROD,
													I6_ACO,
													I6_A_R_CDI,
	
							/* 입회 */
							CASE WHEN I1_2 > 0 THEN ROUND((I1_1 / I1_2 * 100),1)
								ELSE NULL
							END I1_1,
							CASE WHEN I1_2 > 0 THEN ROUND((I1_1 / I1_2 * 40),1)
								ELSE NULL
							END I1_2,
	
							/* 1차검사 CLEAN 합격율이 있을 때만 표기 2018.08.22 */
							CASE WHEN (I1_2 > 0 AND INSP_CNT > 0) THEN ROUND((I2 / INSP_CNT * 100),1)
								ELSE NULL
							END I2_1,
							CASE WHEN (I1_2 > 0 AND INSP_CNT > 0) THEN ROUND((100 - (I2 / INSP_CNT * 100))/100*30,1)
								ELSE NULL
							END I2_2,
	
							CASE WHEN M1 > 0 THEN ROUND(((M1-I3) / M1 * 100),1)
								ELSE NULL
							END I3_1,
							CASE WHEN M1 > 0 THEN ROUND(((M1-I3) / M1 * 100 / 10),1)
								ELSE NULL
							END I3_2,
	
							/* 1차검사 CLEAN 합격율이 있을 때만 표기 2018.08.22 */
							CASE WHEN (I1_2 > 0 AND M1 > 0) THEN ROUND(((M1-I4) / M1 * 100),1)
								ELSE NULL
							END I4_1,
							CASE WHEN (I1_2 > 0 AND M1 > 0) THEN ROUND(((M1-I4) / M1 * 100 / 10),1)
								ELSE NULL
							END I4_2,
	
							/* 1차검사 CLEAN 합격율이 있을 때만 표기 2018.08.22 */
												CASE WHEN (I1_2 > 0 AND INSP_CNT > 0) THEN I6
															ELSE NULL
												END AS I6_1, /* 선주불만족도 % */
												CASE WHEN (I1_2 > 0 AND INSP_CNT > 0) THEN ( CASE WHEN 10 - I6 > 0 THEN 10 - I6 ELSE 0 END )
															ELSE 0
												END AS I6_2, /* 선주불만족도 점수 추가 2018.07.11 */
												/*  검사 CMT삭제, 기초품질점수 환산 로직 수정 2018.07.11 */
												0 AS F1_1,
												0 AS F1_2,
												F2 AS F2_1,
											CASE WHEN (10 - (F2*0.5)) < 0 THEN 0 ELSE 10 - (F2*0.5) END AS F2_2, /* 기초품질점수 환산 로직 수정 2018.07.11 */
	
												0 AS B1_1,
												0 AS B1_2,
												0 AS B2_1,
												0 AS B2_2,
	
												0 AS C1_1,
												0 AS C1_2,
												0 AS C2_1,
												0 AS C2_2
					FROM TEMP_DATA1 A
				)
				SELECT	A.DEPT_CODE,
						A.DEPT_NAME,
						A.DEPT_TYPE,
						A.INOUT,
						A.INOUT_NM,
						A.SECT_CD,
						A.SECT_NM,
						A.SECT_USER_CD,
						A.SECT_USER_NM,
						A.TEAM_CD,
						A.TEAM_NM,
						A.TEAM_USER_CD,
						A.TEAM_USER_NM,
						A.USER_ID,
						A.NAME,
						A.VISIBLE_CHECK_CNT,
						A.INSP_CNT,
						A.INSP_CNT_R,
						A.R1,
						A.R2,
						A.R3,
						A.R4,
						A.R5,
						A.M1,
						A.I6_AR,
						A.I6_RPW,
						A.I6_CDI,
						A.I6_ACI,
						A.I6_AMD,
						A.I6_ROD,
						A.I6_ACO,
						A.I6_A_R_CDI,
						ROUND(A.I1_1) AS I1_1,
						ROUND(A.I1_2) AS I1_2,
						ROUND(A.I2_1) AS I2_1,
						ROUND(A.I2_2) AS I2_2,
						ROUND(A.I3_1) AS I3_1,
						ROUND(A.I3_2) AS I3_2,
						ROUND(A.I4_1) AS I4_1,
						ROUND(A.I4_2) AS I4_2,
						ROUND(A.I6_1) AS I6_1,
						ROUND(A.I6_2) AS I6_2,
						ROUND(A.F1_1) AS F1_1,
						ROUND(A.F1_2) AS F1_2,
						ROUND(A.F2_1) AS F2_1,
						ROUND(A.F2_2) AS F2_2,
						ROUND(A.B1_1) AS B1_1,
						ROUND(A.B1_2) AS B1_2,
						ROUND(A.B2_1) AS B2_1,
						ROUND(A.B2_2) AS B2_2,
						ROUND(A.C1_1) AS C1_1,
						ROUND(A.C1_2) AS C1_2,
						ROUND(A.C2_1) AS C2_1,
						ROUND(A.C2_2) AS C2_2,
						ROUND(I1_2 + I2_2 + I3_2 + I4_2) AS I5,
						ROUND(F1_2 + F2_2) AS FT,
						ROUND(B1_2 + B2_2) AS BT,
						ROUND(C1_2 + C2_2) AS CT,
						ROUND(NVL(I1_2,0) + NVL(I2_2,0) + NVL(I4_2,0) + NVL(I6_2,0) + NVL(F1_2,0) + NVL(F2_2,0) + NVL(B1_2,0) + NVL(B2_2,0) + NVL(C1_2,0) + NVL(C2_2,0)) AS TT
					FROM TEMP_DATA2 A
				WHERE 1=1
					AND (NVL('${req.body.IN_DISPLAY_ALL_YN}','N') = 'Y' OR A.VISIBLE_CHECK_CNT > 0 OR F2_1 > 0) /* 검사건수 없고, 기초품질건만 있는 것도 나오도록 2018.07.11 */
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});
	
	/*
	 * 검사합격율(일일) 목록을 불러옴(최근 ?개의 데이터)
	 * @days: 불러올 일수
	 */
	app.post('/api/get/day_success_point', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	IN_DAT,					/* 집계일자 */
					SUBSTR(IN_DAT, 5, 2) || '.' || SUBSTR(IN_DAT, 7, 2) AS IN_DAT_MD,	/* 집계일자(월일) */
					SUM(PERT_O) AS PERT_O,	/* 직영 합격율 */
					SUM(PERT_X) AS PERT_X	/* 외주 합격율 */
			FROM	(
						SELECT	IN_DAT,
								DECODE(GUBUN, 'O', PERT, 0) AS PERT_O,
								DECODE(GUBUN, 'X', PERT, 0) AS PERT_X /* 외주 합격율 */
						FROM	DTM_UA1003
						WHERE	DPT_COD = 'C550'
								AND ROWNUM <= (${req.body.days} * 2)
						ORDER	BY IN_DAT DESC
					)
			GROUP   BY IN_DAT
			ORDER	BY IN_DAT
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});

	/*
	 * 작업 계획 작성률 목록을 불러옴
	 */
	app.post('/api/get/do_work_plan', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	DT,
					SUBSTR(DT, 5, 2) || '.' || SUBSTR(DT, 7, 2) AS DT_MD,
					SUM(TM_SKID1) AS TM_SKID1,
					SUM(TM_SKID2) AS TM_SKID2,
					SUM(TM_JL1) AS TM_JL1,
					SUM(TM_JJ1) AS TM_JJ1,
					SUM(TM_JJ2) AS TM_JJ2,
					SUM(TM_JJ3) AS TM_JJ3,
					SUM(TM_FIX1) AS TM_FIX1,
					SUM(TM_FIX2) AS TM_FIX2
			FROM	(
						SELECT	WD AS DT,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'SKID1팀', PLAN_PERC, 0) AS TM_SKID1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'SKID2팀', PLAN_PERC, 0) AS TM_SKID2,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '조립1팀', PLAN_PERC, 0) AS TM_JL1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '중조1팀', PLAN_PERC, 0) AS TM_JJ1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '중조2팀', PLAN_PERC, 0) AS TM_JJ2,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '중조3팀', PLAN_PERC, 0) AS TM_JJ3,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'FIX1팀', PLAN_PERC, 0) AS TM_FIX1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'FIX2팀', PLAN_PERC, 0) AS TM_FIX2
						FROM	DTM_UA1004
						WHERE	WD = TO_CHAR(SYSDATE, 'YYYYMMDD')
					)
			GROUP	BY DT
		`;

		// // 쿼리를 정의함
		// const query = `
		// 	SELECT	WD,
		// 			TEAM_NM,
		// 			PLAN_PERC
		// 	FROM	DTM_UA1004
		// 	WHERE	WD = TO_CHAR(SYSDATE, 'YYYYMMDD')
		// 			AND DEPT_CD = 'C550'
		// 	ORDER	BY TEAM_NM
		// `;
		
		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('ERPUSER', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});

	/*
	 * 작업 실적 입력률 목록을 불러옴
	 */
	app.post('/api/get/work_perform', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	DT,
					SUBSTR(DT, 5, 2) || '.' || SUBSTR(DT, 7, 2) AS DT_MD,
					SUM(TM_SKID1) AS TM_SKID1,
					SUM(TM_SKID2) AS TM_SKID2,
					SUM(TM_JL1) AS TM_JL1,
					SUM(TM_JJ1) AS TM_JJ1,
					SUM(TM_JJ2) AS TM_JJ2,
					SUM(TM_JJ3) AS TM_JJ3,
					SUM(TM_FIX1) AS TM_FIX1,
					SUM(TM_FIX2) AS TM_FIX2
			FROM	(
						SELECT	WD AS DT,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'SKID1팀', EXEC_PERC, 0) AS TM_SKID1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'SKID2팀', EXEC_PERC, 0) AS TM_SKID2,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '조립1팀', EXEC_PERC, 0) AS TM_JL1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '중조1팀', EXEC_PERC, 0) AS TM_JJ1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '중조2팀', EXEC_PERC, 0) AS TM_JJ2,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '중조3팀', EXEC_PERC, 0) AS TM_JJ3,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'FIX1팀', EXEC_PERC, 0) AS TM_FIX1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'FIX2팀', EXEC_PERC, 0) AS TM_FIX2
						FROM	DTM_UA1004
						WHERE	WD = TO_CHAR(SYSDATE - 1, 'YYYYMMDD')
					)
			GROUP	BY DT
		`;

		// // 쿼리를 정의함
		// const query = `
		// 	SELECT	WD,
		// 			TEAM_NM,
		// 			EXEC_PERC
		// 	FROM	DTM_UA1004
		// 	WHERE	WD = TO_CHAR(SYSDATE - 1, 'YYYYMMDD')
		// 			AND DEPT_CD = 'C550'
		// 	ORDER	BY TEAM_NM
		// `;
		
		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('ERPUSER', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});

	/*
	 * 주간 작업지시 작성률(계획) 목록을 불러옴
	 */
	app.post('/api/get/do_week_plan', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	DT,
					SUBSTR(DT, 5, 2) || '.' || SUBSTR(DT, 7, 2) AS DT_MD,
					SUM(TM_SKID1) AS TM_SKID1,
					SUM(TM_SKID2) AS TM_SKID2,
					SUM(TM_JL1) AS TM_JL1,
					SUM(TM_JJ1) AS TM_JJ1,
					SUM(TM_JJ2) AS TM_JJ2,
					SUM(TM_JJ3) AS TM_JJ3,
					SUM(TM_FIX1) AS TM_FIX1,
					SUM(TM_FIX2) AS TM_FIX2
			FROM	(
						SELECT	WD AS DT,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'SKID1팀', PLAN_PERC, 0) AS TM_SKID1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'SKID2팀', PLAN_PERC, 0) AS TM_SKID2,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '조립1팀', PLAN_PERC, 0) AS TM_JL1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '중조1팀', PLAN_PERC, 0) AS TM_JJ1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '중조2팀', PLAN_PERC, 0) AS TM_JJ2,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '중조3팀', PLAN_PERC, 0) AS TM_JJ3,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'FIX1팀', PLAN_PERC, 0) AS TM_FIX1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'FIX2팀', PLAN_PERC, 0) AS TM_FIX2
						FROM	DTM_UA1004
						WHERE	WD >= TO_CHAR(SYSDATE - 7, 'YYYYMMDD')
								AND WD <= TO_CHAR(SYSDATE, 'YYYYMMDD')
								AND TO_CHAR(TO_DATE(WD, 'YYYYMMDD'), 'D') <> '1'
					)
			GROUP	BY DT
			ORDER	BY DT
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('ERPUSER', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});

	/*
	 * 주간 작업지시 작성률(실적) 목록을 불러옴
	 */
	app.post('/api/get/do_week_work', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	DT,
					SUBSTR(DT, 5, 2) || '.' || SUBSTR(DT, 7, 2) AS DT_MD,
					SUM(TM_SKID1) AS TM_SKID1,
					SUM(TM_SKID2) AS TM_SKID2,
					SUM(TM_JL1) AS TM_JL1,
					SUM(TM_JJ1) AS TM_JJ1,
					SUM(TM_JJ2) AS TM_JJ2,
					SUM(TM_JJ3) AS TM_JJ3,
					SUM(TM_FIX1) AS TM_FIX1,
					SUM(TM_FIX2) AS TM_FIX2
			FROM	(
						SELECT	WD AS DT,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'SKID1팀', EXEC_PERC, 0) AS TM_SKID1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'SKID2팀', EXEC_PERC, 0) AS TM_SKID2,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '조립1팀', EXEC_PERC, 0) AS TM_JL1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '중조1팀', EXEC_PERC, 0) AS TM_JJ1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '중조2팀', EXEC_PERC, 0) AS TM_JJ2,
								DECODE(REPLACE(TEAM_NM, ' ', ''), '중조3팀', EXEC_PERC, 0) AS TM_JJ3,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'FIX1팀', EXEC_PERC, 0) AS TM_FIX1,
								DECODE(REPLACE(TEAM_NM, ' ', ''), 'FIX2팀', EXEC_PERC, 0) AS TM_FIX2
						FROM	DTM_UA1004
						WHERE	WD >= TO_CHAR(SYSDATE - 7, 'YYYYMMDD')
								AND WD <= TO_CHAR(SYSDATE, 'YYYYMMDD')
								AND TO_CHAR(TO_DATE(WD, 'YYYYMMDD'), 'D') <> '1'
					)
			GROUP	BY DT
			ORDER	BY DT
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('ERPUSER', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});

	/*
	 * 블럭 호선 매트릭스 목록을 불러옴
	 */
	app.post('/api/get/block', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	A.JBN_DIS,				/* 부서코드 */
					A.FIG_SHP,				/* 호선 */
					A.ITM_COD,				/* 블록 */
					A.ACT_COD,				/* ITEM UNIQUE 정보 (호선+블록+공정+공종) */
					A.OUT_DUR,				/* 반출공기 */
					A.WRKCNTR_NAME,			/* 작업팀명 */
					A.WRKCNTR,				/* 작업팀코드 */
					A.SEQ_NO,				/* 분할정보 */
					A.JBN_N_X,				/* X좌표 */
					A.JBN_N_Y,				/* Y좌표 */
					A.ROT_ANG2,				/* 회전값(메트릭스와 별개로 사용자가 회전시킨 값) */
					DECODE(A.JBN_ST, NULL, ' ', A.JBN_ST) AS JBN_ST,					/* 배치시작일 */
					DECODE(A.JBN_FI, NULL, ' ', A.JBN_FI) AS JBN_FI,					/* 배치종료일 */
					DECODE(A.UNI_STG, NULL, ' ', A.UNI_STG) AS UNI_STG,					/* 정반코드 */
					DECODE(B.METRIX, NULL, ' ', B.METRIX) AS METRIX,					/* 메트릭스 */
					DECODE(A.PLAN_SIGN_VAL, NULL, 0, A.PLAN_SIGN_VAL) AS PLAN_SIGN_VAL, /* 버퍼침투일 */
					DECODE(A.BLK_TOP, NULL, 0, A.BLK_TOP) AS BLK_TOP,					/* 조립블록 탑재율 */
					DECODE(A.BLK_TRACE, NULL, 0, A.BLK_TRACE) AS BLK_TRACE,				/* 부재투입율 */
					DECODE(A.EST_ST_PP, NULL, ' ', A.EST_ST_PP) AS EST_ST_PP,			/* 실행계획착수일(또는 A.EST_ST_PP) */
		            DECODE(C.NET_ST_PP, NULL, ' ', C.NET_ST_PP) AS NET_ST_PP,			/* 실행계획착수일(또는 A.EST_ST_PP) */
					A.PP_PLAN,				/* 중일정 계획일정(또는 A.EST_ST_PP) */
					0 AS BLOCK_EXIST,		/* 블럭 파일 존재여부(0: 없음, 1: 있음) */
					0 AS BLOCK_FILE_SIZE	/* 블럭 파일 크기(byte) */
			FROM    (
						SELECT  DISTINCT
								JBN_DIS,
								FIG_SHP,
								ITM_COD,
								ACT_COD,
								OUT_DUR,
								WRKCNTR_NAME,
								WRKCNTR,
								SEQ_NO,
								JBN_N_X,
								JBN_N_Y,
								ROT_ANG2,
								JBN_ST,
								JBN_FI,
								UNI_STG,
								EST_ST_PP,
								PKG_CPP045_COM.CAL_SIGN_VAL(FIG_SHP, ACT_COD, JBN_FI) AS PLAN_SIGN_VAL,
								C62A.FN_CPP045_GET_BLOCKTOP(FIG_SHP, ITM_COD) AS BLK_TOP,
								C62A.FN_CPP045_GET_TRACE(FIG_SHP, ITM_COD) AS BLK_TRACE,
								C62A.FN_CPP045_GET_PP_PLAN(FIG_SHP, ACT_COD) AS PP_PLAN
						FROM    C62A.APM_RSLT001
						WHERE   JBN_DIS = 'C55000-01'
								AND (
									JBN_ST IS NULL
									OR    (
										JBN_ST <= TO_CHAR(SYSDATE,'YYYYMMDD')
										AND    JBN_FI >= TO_CHAR(SYSDATE,'YYYYMMDD')
									)
								)
					) A,
					C62A.APM_METRIX B,
					CJ01.TSEN200 C
			WHERE   A.FIG_SHP = B.SHPNO(+)
					AND A.ITM_COD = B.ITM_COD(+)
					AND A.ACT_COD = C.ACT_COD(+)
					AND A.FIG_SHP = C.FIG_SHP(+)
					AND A.ITM_COD = C.ITM_COD(+) 
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 불러온 데이터에 해당하는 파일이 실제로 있는지 확인함
			data.map((row, idx) => {
				const filePath = `${config.localInfo.path}/${row.FIG_SHP}_${row.ITM_COD}.zip`;

				fileExists(filePath, (err, exists) => {
					// 파일이 없는지 판단하여 결과값을 적용함
					row.BLOCK_EXIST = exists ? 1 : 0;

					// 불러온 파일 용량을 적용함
					row.BLOCK_FILE_SIZE = exists ? fileBytes.sync(filePath) : 0;

					// 파일을 모두 확인한 후, 데이터를 사용자에게 전송함
					if (data.length == idx + 1) {
						// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
						sendData('get', res, resultType, data);

						// data.map((row, idx) => {
						// 	console.log(`${idx}: ${row.BLOCK_EXIST} ${row.FIG_SHP}_${row.ITM_COD}.zip`);
						// });
					}
				});
			});
		});
 	});

	/*
	 * 요약 정보 목록을 불러옴
	 */
	app.post('/api/get/summary_info', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT T_BASE.FACTORY_CD
			, AUTO_DIV_NM      AUTO_DIV
			, DECODE(WKR_CNT, NULL, 0, WKR_CNT)          WORKER_NUMBER
			, DECODE(ARC_CNT, NULL, 0, ARC_CNT) ARC_NUMBER
			, DECODE(T_ACT.TWK_TIME, NULL, 0, T_ACT.TWK_TIME)   WORK_TIME
			, DECODE(T_ACT.ACT_TIME, NULL, 0, T_ACT.ACT_TIME)   ARC_TIME
			, ( 
				SELECT CASE WHEN COUNT(*) > 0 THEN TO_CHAR(COUNT(*)) ELSE ''END 
				FROM XJ01.TWEDAS_WELDER_INFO TW
				WHERE TW.FACTORY_CD = T_BASE.FACTORY_CD
			  ) WELDING_NUMBER
			, DECODE(ARC_RATE, NULL, 0, ROUND(ARC_RATE, 0))         ARC_PERCENT 
			FROM 
			(
			SELECT FAC.GUBUN
			, FAC.FACTORY_CD
			, FAC.FACTORY_NM
			, FA.AUTO_DIV
			, FA.AUTO_DIV_NM
			FROM 
			( 
				SELECT ROWNUM GUBUN, FACTORY_CD, FACTORY_NM
				FROM XJ01.TWEDAS_FACTORY_INFO   
				WHERE FACTORY_CD = 'F100' 
			) FAC
			LEFT OUTER JOIN 
			(
				SELECT DTL_CD AUTO_DIV
				, CD_NM  AUTO_DIV_NM
				FROM XJ01.TWEDAS_CODE_MST     
				WHERE GRP_CD  = 'AUTO' 
				AND DTL_CD != '*'
				AND USE_YN  = 'Y'
				UNION ALL
				SELECT 'ALL'  AUTO_DIV
				, '합계' AUTO_DIV_NM
				FROM DUAL 
			) FA 
				ON 1=1 
			) T_BASE
			LEFT OUTER JOIN 
			( 
			SELECT  FACTORY_CD,  AUTO_DIV, WKR_CNT , 0 ARC_CNT
				, SUM(WK_TIME) - SUM(NON_ACT_TIME)     TWK_TIME
				, SUM(WK_TIME)                          WK_TIME
				, SUM(ACT_TIME)                        ACT_TIME
				, SUM(NON_ACT_TIME)                NON_ACT_TIME
				, XJ01.PKG_CPP043_COM.FUNC_GET_ARC_RATE(SUM(WK_TIME), SUM(NON_ACT_TIME), SUM(ACT_TIME)) ARC_RATE 
			FROM 
			(
				SELECT FACTORY_CD,  NVL(AUTO_DIV, 'TCH') AUTO_DIV, EMP_NO, WORKER_NM
				, SUM( CASE WHEN ACT_DIV < '200' THEN ACT_TIME ELSE 0 END ) ACT_TIME
				, SUM( CASE WHEN ACT_DIV  = '310' AND NON_WELD_DIV = '910' THEN NULL ELSE WK_TIME END ) WK_TIME
				, SUM( CASE WHEN ACT_DIV >= '200' AND ( ACT_DIV = '310' AND NON_WELD_DIV = '910') THEN 0
							WHEN ACT_DIV >= '200' THEN ACT_TIME
						ELSE 0 
						END ) NON_ACT_TIME 
				, COUNT(DISTINCT EMP_NO || WORKER_NM) OVER (PARTITION BY FACTORY_CD,  NVL(AUTO_DIV, 'TCH')) WKR_CNT
				FROM XJ01.TWEDAS_ACT T_ACT
				WHERE FACTORY_CD = 'F100'
				AND DUTY_DIV   = '110'
				AND ACT_BEGIN_DT = TO_CHAR(SYSDATE,'YYYYMMDD') 
				GROUP BY FACTORY_CD,  NVL(AUTO_DIV, 'TCH'), EMP_NO, WORKER_NM
			) T1
			GROUP BY FACTORY_CD,  AUTO_DIV, WKR_CNT
			UNION ALL
			SELECT FACTORY_CD,  'ALL' AUTO_DIV, WKR_CNT
				, (
				SELECT COUNT(DISTINCT WELDER_ID) ARC_CNT
				FROM XJ01.TWEDAS_ACT T_ACT
				WHERE FACTORY_CD = 'F100'                                       
					AND ACT_BEGIN_DT = TO_CHAR(SYSDATE,'YYYYMMDD') 
				GROUP BY FACTORY_CD
				) ARC_CNT
			, SUM(WK_TIME) - SUM(NON_ACT_TIME)     TWK_TIME
				, SUM(WK_TIME)                          WK_TIME
				, SUM(ACT_TIME)                        ACT_TIME
				, SUM(NON_ACT_TIME)                NON_ACT_TIME
				, XJ01.PKG_CPP043_COM.FUNC_GET_ARC_RATE(SUM(WK_TIME), SUM(NON_ACT_TIME), SUM(ACT_TIME)) ARC_RATE 
			FROM 
			( 
				SELECT FACTORY_CD,  EMP_NO, WORKER_NM
				, SUM( CASE WHEN ACT_DIV < '200' THEN ACT_TIME ELSE 0 END ) ACT_TIME
				, SUM( CASE WHEN ACT_DIV  = '310' AND NON_WELD_DIV = '910' THEN NULL ELSE WK_TIME END ) WK_TIME
				, SUM( CASE WHEN ACT_DIV >= '200' AND ( ACT_DIV = '310' AND NON_WELD_DIV = '910') THEN 0
							WHEN ACT_DIV >= '200' THEN ACT_TIME
						ELSE 0 
						END ) NON_ACT_TIME 
				, COUNT(DISTINCT EMP_NO || WORKER_NM) OVER (PARTITION BY FACTORY_CD) WKR_CNT
				FROM XJ01.TWEDAS_ACT T_ACT
				WHERE FACTORY_CD = 'F100'
				AND DUTY_DIV   = '110'
				AND ACT_BEGIN_DT = TO_CHAR(SYSDATE,'YYYYMMDD') 
				GROUP BY FACTORY_CD,  EMP_NO, WORKER_NM
			) T1
			GROUP BY FACTORY_CD,  WKR_CNT    
			) T_ACT 
			ON T_BASE.FACTORY_CD = T_ACT.FACTORY_CD
			AND T_BASE.AUTO_DIV   = T_ACT.AUTO_DIV
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});

	/*
	 * 크레인 가동율 및 작업실적 추이 목록을 불러옴(현재 월까지)
	 */
	app.post('/api/get/crane_latest_result', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	A.WORK_YM,
					SUBSTR(A.WORK_YM, 5, 2) || '월' AS WORK_M,
					DECODE(B.WORK_PLAN, NULL, 0, B.WORK_PLAN) AS WORK_PLAN,
					DECODE(C.WORK_RESULT, NULL, 0, C.WORK_RESULT) AS WORK_RESULT,
					DECODE(ROUND(C.WORK_RESULT * 100 / B.WORK_PLAN, 0), NULL, 0, ROUND(C.WORK_RESULT * 100 / B.WORK_PLAN, 0)) AS WORK_RATIO
			FROM	(
						SELECT	TO_CHAR(SYSDATE, 'YYYY') || LPAD(LEVEL, 2, '0') AS WORK_YM
						FROM	DUAL
						CONNECT	BY LEVEL >= 1
								AND LEVEL <= TO_CHAR(SYSDATE, 'MM')
					) A
			LEFT	OUTER JOIN (
						SELECT	SUBSTR(WORK_DAT, 1, 6) AS WORK_YM,
								SUM(NVL(BLK_WGT, 0)) AS WORK_PLAN
						FROM	APM_CRAN004
						WHERE	SUBSTR(WORK_DAT, 1, 6) = TO_CHAR(SYSDATE, 'YYYYMM')
						GROUP	BY SUBSTR(WORK_DAT, 1, 6)
					) B
					ON A.WORK_YM = B.WORK_YM
			LEFT	OUTER JOIN (
						SELECT	SUBSTR(WORK_DAT, 1, 6) AS WORK_YM,
								SUM(NVL(BLK_WGT, 0)) AS WORK_RESULT
						FROM	APM_CRAN004
						WHERE	SUBSTR(WORK_DAT, 1, 6) = TO_CHAR(SYSDATE, 'YYYYMM')
								AND WORK_YN = 'Y'
						GROUP	BY SUBSTR(WORK_DAT, 1, 6)
					) C
					ON A.WORK_YM = C.WORK_YM
		`;
	
		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});

	/*
	 * 크레인 가동율 및 작업실적 추이 목록을 불러옴
	 */
	app.post('/api/get/crane_result', (req, res) => {
		// // 쿼리를 정의함
		// const query = `
		// 	SELECT SRT, GBN,
		// 			CASE WHEN SRT = '3' AND NVL(PLN_01, 0) > 100 THEN 100 ELSE PLN_01 END AS VAL_1,
		// 			CASE WHEN SRT = '3' AND NVL(PLN_02, 0) > 100 THEN 100 ELSE PLN_02 END AS VAL_2,
		// 			CASE WHEN SRT = '3' AND NVL(PLN_03, 0) > 100 THEN 100 ELSE PLN_03 END AS VAL_3,
		// 			CASE WHEN SRT = '3' AND NVL(PLN_04, 0) > 100 THEN 100 ELSE PLN_04 END AS VAL_4,
		// 			CASE WHEN SRT = '3' AND NVL(PLN_05, 0) > 100 THEN 100 ELSE PLN_05 END AS VAL_5,
		// 			CASE WHEN SRT = '3' AND NVL(PLN_06, 0) > 100 THEN 100 ELSE PLN_06 END AS VAL_6,
		// 			CASE WHEN SRT = '3' AND NVL(PLN_07, 0) > 100 THEN 100 ELSE PLN_07 END AS VAL_7,
		// 			CASE WHEN SRT = '3' AND NVL(PLN_08, 0) > 100 THEN 100 ELSE PLN_08 END AS VAL_8,
		// 			CASE WHEN SRT = '3' AND NVL(PLN_09, 0) > 100 THEN 100 ELSE PLN_09 END AS VAL_9,
		// 			CASE WHEN SRT = '3' AND NVL(PLN_10, 0) > 100 THEN 100 ELSE PLN_10 END AS VAL_10,
		// 			CASE WHEN SRT = '3' AND NVL(PLN_11, 0) > 100 THEN 100 ELSE PLN_11 END AS VAL_11,
		// 			CASE WHEN SRT = '3' AND NVL(PLN_11, 0) > 100 THEN 100 ELSE PLN_12 END AS VAL_12,
        //             PLN_CURRENT AS VAL_CURRENT
		// 	FROM (SELECT '1' AS SRT, 
		// 					'계획(Ton)' AS GBN,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '01' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_01,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '02' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_02,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '03' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_03,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '04' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_04,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '05' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_05,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '06' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_06,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '07' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_07,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '08' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_08,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '09' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_09,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '10' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_10,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '11' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_11,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '12' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_12,
		// 					0 AS PLN_CURRENT
		// 			FROM APM_CRAN004
		// 			WHERE WORK_DAT LIKE '2019%'   -- 년월
		// 	--                       AND BAY_DIV LIKE IN_BAY_DIV||'%' -- BAY
		// 	--                       AND CRAN_NO LIKE IN_CRAN_NO||'%' -- 크레인
		// 			UNION ALL   
		// 			SELECT '2' AS SRT, 
		// 					'실적(Ton)' AS GBN,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '01' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_01,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '02' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_02,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '03' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_03,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '04' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_04,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '05' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_05,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '06' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_06,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '07' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_07,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '08' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_08,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '09' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_09,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '10' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_10,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '11' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_11,
		// 					SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '12' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_12,
		// 					0 AS PLN_CURRENT
		// 			FROM APM_CRAN004
		// 			WHERE WORK_DAT LIKE '2019%'    -- 년월
		// 	--                       AND BAY_DIV LIKE IN_BAY_DIV||'%'  -- BAY
		// 	--                       AND CRAN_NO LIKE IN_CRAN_NO||'%'  -- 크레인 
		// 			UNION ALL   
		// 			SELECT '3' AS SRT, 
		// 					'가동율(%)' AS GBN,
		// 					CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '01' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
		// 						ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '01' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
		// 								SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '01' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
		// 					ELSE NULL END AS  PLN_01,
		// 					CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '02' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
		// 						ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '02' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
		// 								SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '02' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
		// 					ELSE NULL END AS  PLN_02,
		// 					CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '03' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
		// 						ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '03' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
		// 								SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '03' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
		// 					ELSE NULL END AS  PLN_03,
		// 					CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '04' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
		// 						ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '04' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
		// 								SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '04' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
		// 					ELSE NULL END AS  PLN_04,
		// 					CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '05' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
		// 						ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '05' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
		// 								SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '05' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
		// 					ELSE NULL END AS  PLN_05,
		// 					CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '06' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
		// 						ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '06' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
		// 								SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '06' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
		// 					ELSE NULL END AS  PLN_06,
		// 					CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '07' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
		// 						ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '07' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
		// 								SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '07' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
		// 					ELSE NULL END AS  PLN_07,
		// 					CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '08' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
		// 						ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '08' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
		// 								SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '08' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
		// 					ELSE NULL END AS  PLN_08,
		// 					CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '09' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
		// 						ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '09' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
		// 								SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '09' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
		// 					ELSE NULL END AS  PLN_09,
		// 					CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '10' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
		// 						ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '10' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
		// 								SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '10' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
		// 					ELSE NULL END AS  PLN_10,
		// 					CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '11' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
		// 						ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '11' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
		// 								SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '11' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
		// 					ELSE NULL END AS  PLN_11,
		// 					CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '12' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
		// 						ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '12' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
		// 								SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '12' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
		// 					ELSE NULL END AS  PLN_12,
		// 					CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = TO_CHAR(SYSDATE, 'MM') THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
		// 					ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = TO_CHAR(SYSDATE, 'MM') AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
		// 						   SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = TO_CHAR(SYSDATE, 'MM') THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
	 	// 				    ELSE NULL END AS  PLN_CURRENT
		// 			FROM APM_CRAN004
		// 			WHERE WORK_DAT LIKE '2019%')      -- 년월
		// 	/*                       AND BAY_DIV LIKE IN_BAY_DIV||'%'    -- BAY */
		// 	/*					AND CRAN_NO LIKE IN_CRAN_NO||'%' )  -- 크레인 */
		// 	ORDER BY SRT
		// `;

		// 쿼리를 정의함
		const query = `
			SELECT	A.WORK_YM AS WORK_RAW_YM,
					SUBSTR(A.WORK_YM, 1, 4) || '.' || SUBSTR(A.WORK_YM, 5, 2) AS WORK_YM,
					SUBSTR(A.WORK_YM, 5, 2) || '월' AS WORK_M,
					DECODE(B.WORK_PLAN, NULL, 0, B.WORK_PLAN) AS WORK_PLAN,
					DECODE(C.WORK_RESULT, NULL, 0, C.WORK_RESULT) AS WORK_RESULT,
					DECODE(ROUND(C.WORK_RESULT * 100 / B.WORK_PLAN, 0), NULL, 0, ROUND(C.WORK_RESULT * 100 / B.WORK_PLAN, 0)) AS WORK_RATIO
			FROM	(
						SELECT	TO_CHAR(SYSDATE, 'YYYY') || LPAD(LEVEL, 2, '0') AS WORK_YM
						FROM	DUAL
						CONNECT	BY LEVEL >= 1
								AND LEVEL <= 12
					) A
			LEFT	OUTER JOIN (
						SELECT	SUBSTR(WORK_DAT, 1, 6) AS WORK_YM,
								SUM(NVL(BLK_WGT, 0)) AS WORK_PLAN
						FROM	APM_CRAN004
						WHERE	SUBSTR(WORK_DAT, 1, 6) = TO_CHAR(SYSDATE, 'YYYYMM')
						GROUP	BY SUBSTR(WORK_DAT, 1, 6)
					) B
					ON A.WORK_YM = B.WORK_YM
			LEFT	OUTER JOIN (
						SELECT	SUBSTR(WORK_DAT, 1, 6) AS WORK_YM,
								SUM(NVL(BLK_WGT, 0)) AS WORK_RESULT
						FROM	APM_CRAN004
						WHERE	SUBSTR(WORK_DAT, 1, 6) = TO_CHAR(SYSDATE, 'YYYYMM')
								AND WORK_YN = 'Y'
						GROUP	BY SUBSTR(WORK_DAT, 1, 6)
					) C
					ON A.WORK_YM = C.WORK_YM
		`;
	
		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});

	/*
	 * 크레인 가동율 및 작업실적 추이 목록을 불러옴(그리드용)
	 */
	app.post('/api/get/crane_result_grid', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT SRT, GBN,
					CASE WHEN SRT = '3' AND NVL(PLN_01, 0) > 100 THEN 100 ELSE DECODE(PLN_01, NULL, 0, PLN_01) END AS VAL_1,
					CASE WHEN SRT = '3' AND NVL(PLN_02, 0) > 100 THEN 100 ELSE DECODE(PLN_02, NULL, 0, PLN_02) END AS VAL_2,
					CASE WHEN SRT = '3' AND NVL(PLN_03, 0) > 100 THEN 100 ELSE DECODE(PLN_03, NULL, 0, PLN_03) END AS VAL_3,
					CASE WHEN SRT = '3' AND NVL(PLN_04, 0) > 100 THEN 100 ELSE DECODE(PLN_04, NULL, 0, PLN_04) END AS VAL_4,
					CASE WHEN SRT = '3' AND NVL(PLN_05, 0) > 100 THEN 100 ELSE DECODE(PLN_05, NULL, 0, PLN_05) END AS VAL_5,
					CASE WHEN SRT = '3' AND NVL(PLN_06, 0) > 100 THEN 100 ELSE DECODE(PLN_06, NULL, 0, PLN_06) END AS VAL_6,
					CASE WHEN SRT = '3' AND NVL(PLN_07, 0) > 100 THEN 100 ELSE DECODE(PLN_07, NULL, 0, PLN_07) END AS VAL_7,
				    CASE WHEN SRT = '3' AND NVL(PLN_08, 0) > 100 THEN 100 ELSE DECODE(PLN_08, NULL, 0, PLN_08) END AS VAL_8,
                    CASE WHEN SRT = '3' AND NVL(PLN_09, 0) > 100 THEN 100 ELSE DECODE(PLN_09, NULL, 0, PLN_09) END AS VAL_9,
                    CASE WHEN SRT = '3' AND NVL(PLN_10, 0) > 100 THEN 100 ELSE DECODE(PLN_10, NULL, 0, PLN_10) END AS VAL_10,
                    CASE WHEN SRT = '3' AND NVL(PLN_11, 0) > 100 THEN 100 ELSE DECODE(PLN_11, NULL, 0, PLN_11) END AS VAL_11,
                    CASE WHEN SRT = '3' AND NVL(PLN_11, 0) > 100 THEN 100 ELSE DECODE(PLN_12, NULL, 0, PLN_12) END AS VAL_12
			FROM (SELECT '1' AS SRT, 
							'계획(Ton)' AS GBN,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '01' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_01,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '02' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_02,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '03' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_03,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '04' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_04,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '05' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_05,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '06' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_06,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '07' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_07,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '08' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_08,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '09' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_09,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '10' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_10,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '11' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_11,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '12' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_12
					FROM APM_CRAN004
					WHERE WORK_DAT LIKE '2019%'   -- 년월
			--                       AND BAY_DIV LIKE IN_BAY_DIV||'%' -- BAY
			--                       AND CRAN_NO LIKE IN_CRAN_NO||'%' -- 크레인
					UNION ALL   
					SELECT '2' AS SRT, 
							'실적(Ton)' AS GBN,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '01' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_01,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '02' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_02,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '03' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_03,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '04' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_04,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '05' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_05,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '06' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_06,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '07' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_07,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '08' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_08,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '09' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_09,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '10' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_10,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '11' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_11,
							SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '12' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) AS PLN_12
					FROM APM_CRAN004
					WHERE WORK_DAT LIKE '2019%'    -- 년월
			--                       AND BAY_DIV LIKE IN_BAY_DIV||'%'  -- BAY
			--                       AND CRAN_NO LIKE IN_CRAN_NO||'%'  -- 크레인 
					UNION ALL   
					SELECT '3' AS SRT, 
							'가동율(%)' AS GBN,
							CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '01' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
								ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '01' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
										SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '01' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
							ELSE NULL END AS  PLN_01,
							CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '02' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
								ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '02' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
										SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '02' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
							ELSE NULL END AS  PLN_02,
							CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '03' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
								ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '03' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
										SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '03' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
							ELSE NULL END AS  PLN_03,
							CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '04' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
								ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '04' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
										SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '04' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
							ELSE NULL END AS  PLN_04,
							CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '05' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
								ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '05' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
										SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '05' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
							ELSE NULL END AS  PLN_05,
							CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '06' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
								ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '06' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
										SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '06' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
							ELSE NULL END AS  PLN_06,
							CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '07' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
								ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '07' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
										SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '07' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
							ELSE NULL END AS  PLN_07,
							CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '08' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
								ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '08' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
										SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '08' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
							ELSE NULL END AS  PLN_08,
							CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '09' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
								ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '09' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
										SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '09' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
							ELSE NULL END AS  PLN_09,
							CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '10' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
								ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '10' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
										SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '10' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
							ELSE NULL END AS  PLN_10,
							CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '11' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
								ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '11' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
										SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '11' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
							ELSE NULL END AS  PLN_11,
							CASE WHEN SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '12' THEN NVL(BLK_WGT, 0) ELSE 0 END) > 0 THEN
								ROUND((SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '12' AND WORK_YN = 'Y' THEN NVL(BLK_WGT, 0) ELSE 0 END) / 
										SUM(CASE WHEN SUBSTR(WORK_DAT, 5, 2) = '12' THEN NVL(BLK_WGT, 0) ELSE 0 END) * 100), 0)
							ELSE NULL END AS  PLN_12
					FROM APM_CRAN004
					WHERE WORK_DAT LIKE '2019%')      -- 년월
			/*                       AND BAY_DIV LIKE IN_BAY_DIV||'%'    -- BAY */
			/*					AND CRAN_NO LIKE IN_CRAN_NO||'%' )  -- 크레인 */
			ORDER BY SRT
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});

	/*
	 * 크레인 작업 유형 목록을 불러옴
	 */
	app.post('/api/get/crane_work_type', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT COD_DESC_SHRT AS RET_DESC,
					RET_COT,
					TO_CHAR(ROUND(RET_COT / RET_TOT * 100, 1)) AS RET_PER
			FROM (SELECT T1.WORK_DIV, T2.COD_DESC_SHRT, 
							SUM(1) AS RET_COT,
							(SELECT COUNT(*) FROM APM_CRAN004
							WHERE WORK_DAT LIKE '2019%'    -- 년월
			/*                               AND BAY_DIV LIKE IN_BAY_DIV||'%'  -- BAY */
			/*                               AND CRAN_NO LIKE IN_CRAN_NO||'%'  -- 크레인 */
								AND WORK_DIV > ' ') AS RET_TOT
					FROM APM_CRAN004 T1,
							(SELECT CRNT_COD, COD_DESC_SHRT
							FROM T62ACODE
							WHERE PRNT_COD = 'CR1') T2
					WHERE T1.WORK_DAT LIKE '2019%'     -- 년월
			/*                       AND T1.BAY_DIV LIKE IN_BAY_DIV||'%'   -- BAY */
			/*                       AND T1.CRAN_NO LIKE IN_CRAN_NO||'%'   -- 크레인 */
						AND T1.WORK_DIV = T2.CRNT_COD(+)
						AND T1.WORK_DIV > ' '
					GROUP BY T1.WORK_DIV, T2.COD_DESC_SHRT )
			ORDER BY WORK_DIV
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});
	
	/*
	 * 탑재 블록 정보 목록을 불러옴
	 */
	app.post('/api/get/install_block_info', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	X.SHPNO,			/* 호선번호 */
					X.ITM_COD,			/* 블록번호 */
					X.BLK_TYP,			/* Type */
					X.BLK_SIZE,			/* Size */
					X.BLK_NET_WGT,		/* 중량 */
					Y.WRK_DAT,			/* 탑재일 */
					DECODE(Y.WRK_DAT, NULL, NULL, SUBSTR(Y.WRK_DAT, 1, 4) || '.' || SUBSTR(Y.WRK_DAT, 5, 2) || '.' || SUBSTR(Y.WRK_DAT, 7, 2)) AS WRK_DAT_YMD	/* 투입일 */
			FROM	(
						SELECT	*
						FROM	OPT.V_DIVISION
						WHERE	SHPNO = '${req.body.shipNo}'			/* Parameter 호선번호 */
								AND PARENT_ID = '${req.body.blockNo}'	/* Parameter 블록번호 */
								AND SUBSTR (ITM_COD, 6, 1) IS NULL
						UNION	ALL
						SELECT	*
						FROM	OPT.V_DIVISION
						WHERE	SHPNO = '${req.body.shipNo}'			/* Parameter 호선번호 */
								AND PARENT_ID IN (
									SELECT	ITM_COD
									FROM	OPT.V_DIVISION
									WHERE	SHPNO = '${req.body.shipNo}'			/* Parameter 호선번호 */
											AND PARENT_ID = '${req.body.blockNo}'	/* Parameter 블록번호 */
								)
					) X
			LEFT	OUTER JOIN APM_CRAN012 Y
					ON Y.FIG_SHP = X.SHPNO
					AND Y.ITM_COD = X.ITM_COD
		`;
	
		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});

	/*
	 * 부재 투입 정보 목록을 불러옴
	 */
	app.post('/api/get/input_material_info', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	SHPNO,		/* 호선 */
					LOTNO,		/* LOT No. */
					BLK_NO,		/* 블록 */
					STAGE,		/* 조립 */
					PE_STAGE,	/* PE */
					SUB,		/* 소조기호 */
					PART_NO,	/* 부재기호 */
					LH_CODE,	/* L-H */
					ASTR,		/* 송선 */
					PROC_SYS,	/* 계열 */
					GRADE,		/* 재질 */
					LENG1,		/* 길이(m) */
					LENG2,		/* 폭(m) */
					THK,		/* 두께(mm) */
					WGT,		/* 총 중량(Kg) */
					TAKEDATE,	/* 투입일 */
					DECODE(TAKEDATE, NULL, NULL, SUBSTR(TAKEDATE, 1, 4) || '.' || SUBSTR(TAKEDATE, 5, 2) || '.' || SUBSTR(TAKEDATE, 7, 2)) AS TAKEDATE_YMD	/* 투입일 */
			FROM	T62AW0040
			WHERE	WRKTYP <> 'XX'
					AND SHPNO = '${req.body.shipNo}'		/* Parameter 호선번호 */
					AND (
						A_BLOCK = '${req.body.blockNo}'		/* Parameter 블록번호 */
						OR U_BLOCK = '${req.body.blockNo}'	/* Parameter 블록번호 */
					)
		`;
	
		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});


















	/*
	 * 알람 목록을 불러옴
	 */
	app.post('/api/get/test', (req, res) => {
		// 쿼리를 정의함
		const query = `
			SELECT	*
			FROM	APM_BASE011
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('get', res, resultType, data);
		});
	});

	/*
	 * 
	 */
	app.post('/api/set/new_test', (req, res) => {
		// 받은 인자값을 정의함
		const paramCol1 = req.body.col1;	// 
		const paramCol2 = req.body.col2;	// 
		
		// 쿼리를 정의함
		const query = `
			INSERT	INTO TEST20181024
					(
						N1,
						N2,
						N3,
						N4,
						N5,
						N6,
						REG_DTE
					)
			VALUES	(
						${paramCol1},
						${paramCol2},
						0,
						0,
						0,
						0,
						'20190101'
					)
		`;

		// 쿼리를 실행하여 데이터를 불러옴
		const data = executeQuery('C62A', query, (resultType, data) => {
			// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
			sendData('set', res, resultType, data);
		});
	});














	// /*
	//  * 알람 목록을 불러옴(랜덤으로 1개만 불러옴)
	//  */
	// app.post('/api/get/alarm_one', (req, res) => {
	// 	// 인자값 배열을 생성함(? 순서대로 입력함)
	// 	const arrParamData = [
	// 	];

	// 	// 데이터를 불러옴
	// 	let query = db.query(`
	// 		SELECT	seq,
	// 				subject,
	// 				content,
	// 				action_type,
	// 				action_data,
	// 				date_format(now(), '%Y-%m-%d %H:%i:%s') as ins_datetime_text
	// 		FROM	alarm_preset
	// 		ORDER	BY rand()
	// 		LIMIT	1
	// 	`, arrParamData, (error, response) => {
	// 		if (error) {
	// 			func.setLog(`[Error] RESTful API > ${req.url}: 조회에 실패하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: ${error}`, 'Y', 'Y');

	// 			return res.end(JSON.stringify({
	// 				status: 500,
	// 				result: 'error',
	// 				message: '조회에 실패하였습니다.',
	// 				data: error
	// 			}));
	// 		} else {
	// 			if (Object.keys(response).length == 0) {
	// 				func.setLog(`[Error] RESTful API > ${req.url}: 조회된 내용이 없습니다.`, 'Y', 'N');
	
	// 				return res.end(JSON.stringify({
	// 					status: 204,
	// 					result: 'nothing',
	// 					message: '조회된 내용이 없습니다.',
	// 					data: response
	// 				}));
	// 			} else {
	// 				func.setLog(`[Log] RESTful API > ${req.url}: 조회하였습니다.`, 'Y', 'N');

	// 				return res.end(JSON.stringify({
	// 					status: 200,
	// 					result: 'success',
	// 					message: '조회하였습니다.',
	// 					data: response
	// 				}));
	// 			}
	// 		}
	// 	});
	// });

	// /*
	//  * 기간별 생산량(보드용) 목록을 불러옴
	//  *
	//  * @row_count: 불러올 행 갯수
	//  */
	// app.post('/api/get/output_between_latest_list', (req, res) => {
	// 	// 받은 인자값을 정의함
	// 	const paramRowCount = req.body.row_count;	// 불러올 행 갯수

	// 	// 인자값 배열을 생성함(? 순서대로 입력함)
	// 	const arrParamData = [
	// 	];

	// 	// 데이터를 불러옴
	// 	let query = db.query(`
	// 		SELECT	a.seq,
	// 				concat(substr(a.seq, 5, 2), '-', substr(a.seq, 7, 2)) AS seq_date,
	// 				a.col1,
	// 				a.col2
	// 		FROM	(
	// 					SELECT	*
	// 					FROM	output_between
	// 					WHERE	seq <= date_format(now(), '%Y%m%d')
	// 					ORDER	BY seq DESC
	// 					LIMIT	${paramRowCount}
	// 				) a
	// 		ORDER	BY a.seq
	// 	`, arrParamData, (error, response) => {
	// 		if (error) {
	// 			func.setLog(`[Error] RESTful API > ${req.url}: 조회에 실패하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: @paramRowCount: ${paramRowCount}`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: ${error}`, 'Y', 'Y');

	// 			return res.end(JSON.stringify({
	// 				status: 500,
	// 				result: 'error',
	// 				message: '조회에 실패하였습니다.',
	// 				data: error
	// 			}));
	// 		} else {
	// 			if (Object.keys(response).length == 0) {
	// 				func.setLog(`[Error] RESTful API > ${req.url}: 조회된 내용이 없습니다.`, 'Y', 'N');
	// 				func.setLog(`[Error] RESTful API > ${req.url}: @paramRowCount: ${paramRowCount}`, 'Y', 'N');
	
	// 				return res.end(JSON.stringify({
	// 					status: 204,
	// 					result: 'nothing',
	// 					message: '조회된 내용이 없습니다.',
	// 					data: response
	// 				}));
	// 			} else {
	// 				func.setLog(`[Log] RESTful API > ${req.url}: 조회하였습니다.`, 'Y', 'N');
	// 				func.setLog(`[Log] RESTful API > ${req.url}: @paramRowCount: ${paramRowCount}`, 'Y', 'N');

	// 				return res.end(JSON.stringify({
	// 					status: 200,
	// 					result: 'success',
	// 					message: '조회하였습니다.',
	// 					data: response
	// 				}));
	// 			}
	// 		}
	// 	});
	// });

	// /*
	//  * 기간별 생산량(모달용) 목록을 불러옴
	//  *
	//  * @start_date: 시작일자
	//  * @end_date: 종료일자
	//  */
	// app.post('/api/get/output_between_list', (req, res) => {
	// 	// 받은 인자값을 정의함
	// 	const paramStartDate = req.body.start_date;	// 시작일자 
	// 	const paramEndDate = req.body.end_date;		// 종료일자

	// 	// 인자값 배열을 생성함(? 순서대로 입력함)
	// 	const arrParamData = [
	// 	];

	// 	// 데이터를 불러옴
	// 	let query = db.query(`
	// 		SELECT	seq,
	// 				concat(substr(seq, 5, 2), '-', substr(seq, 7, 2)) AS seq_date,
	// 				col1,
	// 				col2
	// 		FROM	output_between
	// 		WHERE	seq >= ${paramStartDate}
	// 				AND seq <= ${paramEndDate}
	// 		ORDER	BY seq
	// 	`, arrParamData, (error, response) => {
	// 		if (error) {
	// 			func.setLog(`[Error] RESTful API > ${req.url}: 조회에 실패하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: @paramStartDate: ${paramStartDate}`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: @paramEndDate: ${paramEndDate}`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: ${error}`, 'Y', 'Y');

	// 			return res.end(JSON.stringify({
	// 				status: 500,
	// 				result: 'error',
	// 				message: '조회에 실패하였습니다.',
	// 				data: error
	// 			}));
	// 		} else {
	// 			if (Object.keys(response).length == 0) {
	// 				func.setLog(`[Error] RESTful API > ${req.url}: 조회된 내용이 없습니다.`, 'Y', 'N');
	// 				func.setLog(`[Error] RESTful API > ${req.url}: @paramStartDate: ${paramStartDate}`, 'Y', 'N');
	// 				func.setLog(`[Error] RESTful API > ${req.url}: @paramEndDate: ${paramEndDate}`, 'Y', 'N');
	
	// 				return res.end(JSON.stringify({
	// 					status: 204,
	// 					result: 'nothing',
	// 					message: '조회된 내용이 없습니다.',
	// 					data: response
	// 				}));
	// 			} else {
	// 				func.setLog(`[Log] RESTful API > ${req.url}: 조회하였습니다.`, 'Y', 'N');
	// 				func.setLog(`[Log] RESTful API > ${req.url}: @paramStartDate: ${paramStartDate}`, 'Y', 'N');
	// 				func.setLog(`[Log] RESTful API > ${req.url}: @paramEndDate: ${paramEndDate}`, 'Y', 'N');

	// 				return res.end(JSON.stringify({
	// 					status: 200,
	// 					result: 'success',
	// 					message: '조회하였습니다.',
	// 					data: response
	// 				}));
	// 			}
	// 		}
	// 	});
	// });

	// /*
	//  * 반출현황(탭용) 목록을 불러옴
	//  */
	// app.post('/api/get/output_state_list', (req, res) => {
	// 	// 인자값 배열을 생성함(? 순서대로 입력함)
	// 	const arrParamData = [
	// 	];

	// 	// 데이터를 불러옴
	// 	let query = db.query(`
	// 		SELECT	seq,
	// 				col1,
	// 				col2,
	// 				col3,
	// 				col4,
	// 				col5,
	// 				col6,
	// 				col7,
	// 				col8,
	// 				col9,
	// 				col10,
	// 				col11
	// 		FROM	output_state
	// 		ORDER	BY seq DESC
	// 	`, arrParamData, (error, response) => {
	// 		if (error) {
	// 			func.setLog(`[Error] RESTful API > ${req.url}: 조회에 실패하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: ${error}`, 'Y', 'Y');

	// 			return res.end(JSON.stringify({
	// 				status: 500,
	// 				result: 'error',
	// 				message: '조회에 실패하였습니다.',
	// 				data: error
	// 			}));
	// 		} else {
	// 			if (Object.keys(response).length == 0) {
	// 				func.setLog(`[Error] RESTful API > ${req.url}: 조회된 내용이 없습니다.`, 'Y', 'N');
	
	// 				return res.end(JSON.stringify({
	// 					status: 204,
	// 					result: 'nothing',
	// 					message: '조회된 내용이 없습니다.',
	// 					data: response
	// 				}));
	// 			} else {
	// 				func.setLog(`[Log] RESTful API > ${req.url}: 조회하였습니다.`, 'Y', 'N');

	// 				return res.end(JSON.stringify({
	// 					status: 200,
	// 					result: 'success',
	// 					message: '조회하였습니다.',
	// 					data: response
	// 				}));
	// 			}
	// 		}
	// 	});
	// });

	// /*
	//  * 적치현황(탭용) 목록을 불러옴
	//  */
	// app.post('/api/get/cumulative_state_list', (req, res) => {
	// 	// 인자값 배열을 생성함(? 순서대로 입력함)
	// 	const arrParamData = [
	// 	];

	// 	// 데이터를 불러옴
	// 	let query = db.query(`
	// 		SELECT	seq,
	// 				col1,
	// 				col2,
	// 				col3,
	// 				col4,
	// 				col5,
	// 				col6,
	// 				col7,
	// 				col8,
	// 				col9,
	// 				col10,
	// 				col11
	// 		FROM	cumulative_state
	// 		ORDER	BY seq DESC
	// 	`, arrParamData, (error, response) => {
	// 		if (error) {
	// 			func.setLog(`[Error] RESTful API > ${req.url}: 조회에 실패하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: ${error}`, 'Y', 'Y');

	// 			return res.end(JSON.stringify({
	// 				status: 500,
	// 				result: 'error',
	// 				message: '조회에 실패하였습니다.',
	// 				data: error
	// 			}));
	// 		} else {
	// 			if (Object.keys(response).length == 0) {
	// 				func.setLog(`[Error] RESTful API > ${req.url}: 조회된 내용이 없습니다.`, 'Y', 'N');
	
	// 				return res.end(JSON.stringify({
	// 					status: 204,
	// 					result: 'nothing',
	// 					message: '조회된 내용이 없습니다.',
	// 					data: response
	// 				}));
	// 			} else {
	// 				func.setLog(`[Log] RESTful API > ${req.url}: 조회하였습니다.`, 'Y', 'N');

	// 				return res.end(JSON.stringify({
	// 					status: 200,
	// 					result: 'success',
	// 					message: '조회하였습니다.',
	// 					data: response
	// 				}));
	// 			}
	// 		}
	// 	});
	// });

	// /*
	//  * 생산계획(탭용) 목록을 불러옴
	//  */
	// app.post('/api/get/output_plan_list', (req, res) => {
	// 	// 인자값 배열을 생성함(? 순서대로 입력함)
	// 	const arrParamData = [
	// 	];

	// 	// 데이터를 불러옴
	// 	let query = db.query(`
	// 		SELECT	seq,
	// 				col1,
	// 				col2,
	// 				col3,
	// 				col4,
	// 				col5,
	// 				col6,
	// 				col7,
	// 				col8,
	// 				col9,
	// 				col10,
	// 				col11,
	// 				col12
	// 		FROM	output_plan
	// 		ORDER	BY seq DESC
	// 	`, arrParamData, (error, response) => {
	// 		if (error) {
	// 			func.setLog(`[Error] RESTful API > ${req.url}: 조회에 실패하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: ${error}`, 'Y', 'Y');

	// 			return res.end(JSON.stringify({
	// 				status: 500,
	// 				result: 'error',
	// 				message: '조회에 실패하였습니다.',
	// 				data: error
	// 			}));
	// 		} else {
	// 			if (Object.keys(response).length == 0) {
	// 				func.setLog(`[Error] RESTful API > ${req.url}: 조회된 내용이 없습니다.`, 'Y', 'N');
	
	// 				return res.end(JSON.stringify({
	// 					status: 204,
	// 					result: 'nothing',
	// 					message: '조회된 내용이 없습니다.',
	// 					data: response
	// 				}));
	// 			} else {
	// 				func.setLog(`[Log] RESTful API > ${req.url}: 조회하였습니다.`, 'Y', 'N');

	// 				return res.end(JSON.stringify({
	// 					status: 200,
	// 					result: 'success',
	// 					message: '조회하였습니다.',
	// 					data: response
	// 				}));
	// 			}
	// 		}
	// 	});
	// });

	// /*
	//  * 생산추이 목록을 불러옴
	//  */
	// app.post('/api/get/output_history_list', (req, res) => {
	// 	// 받은 인자값을 정의함
	// 	const paramRowCount = req.body.row_count;	// 불러올 행 갯수

	// 	// 인자값 배열을 생성함(? 순서대로 입력함)
	// 	const arrParamData = [
	// 	];

	// 	// 데이터를 불러옴
	// 	let query = db.query(`
	// 		SELECT	a.seq,
	// 				concat(substr(a.seq, 5, 2), '-', substr(a.seq, 7, 2)) AS seq_date,
	// 				a.col1,
	// 				a.col2
	// 		FROM	(
	// 					SELECT	*
	// 					FROM	output_history
	// 					WHERE	seq <= date_format(now(), '%Y%m%d')
	// 					ORDER	BY seq DESC
	// 					LIMIT	${paramRowCount}
	// 				) a
	// 		ORDER	BY a.seq
	// 	`, arrParamData, (error, response) => {
	// 		if (error) {
	// 			func.setLog(`[Error] RESTful API > ${req.url}: 조회에 실패하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: @paramRowCount: ${paramRowCount}`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: ${error}`, 'Y', 'Y');

	// 			return res.end(JSON.stringify({
	// 				status: 500,
	// 				result: 'error',
	// 				message: '조회에 실패하였습니다.',
	// 				data: error
	// 			}));
	// 		} else {
	// 			if (Object.keys(response).length == 0) {
	// 				func.setLog(`[Error] RESTful API > ${req.url}: 조회된 내용이 없습니다.`, 'Y', 'N');
	// 				func.setLog(`[Error] RESTful API > ${req.url}: @paramRowCount: ${paramRowCount}`, 'Y', 'N');
	
	// 				return res.end(JSON.stringify({
	// 					status: 204,
	// 					result: 'nothing',
	// 					message: '조회된 내용이 없습니다.',
	// 					data: response
	// 				}));
	// 			} else {
	// 				func.setLog(`[Log] RESTful API > ${req.url}: 조회하였습니다.`, 'Y', 'N');
	// 				func.setLog(`[Log] RESTful API > ${req.url}: @paramRowCount: ${paramRowCount}`, 'Y', 'N');

	// 				return res.end(JSON.stringify({
	// 					status: 200,
	// 					result: 'success',
	// 					message: '조회하였습니다.',
	// 					data: response
	// 				}));
	// 			}
	// 		}
	// 	});
	// });

	// /*
	//  * 알람이력(탭용) 목록을 불러옴
	//  */
	// app.post('/api/get/alarm_history_list', (req, res) => {
	// 	// 받은 인자값을 정의함
	// 	const paramCategory = req.body.category;	// 설비 종류
	// 	const paramRowCount = req.body.row_count;	// 불러올 행 갯수

	// 	// 인자값 배열을 생성함(? 순서대로 입력함)
	// 	const arrParamData = [
	// 	];

	// 	// 데이터를 불러옴
	// 	let query = db.query(`
	// 		SELECT	seq,
	// 				col1,
	// 				col2,
	// 				col3,
	// 				col4,
	// 				col5,
	// 				col6
	// 		FROM	alarm_history
	// 		WHERE	lower(replace(col1, '-', '')) LIKE concat('%', lower('${paramCategory}'), '%')
	// 		ORDER	BY seq DESC
	// 		LIMIT	${paramRowCount}
	// 	`, arrParamData, (error, response) => {
	// 		if (error) {
	// 			func.setLog(`[Error] RESTful API > ${req.url}: 조회에 실패하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: @paramCategory: ${paramCategory}`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: @paramRowCount: ${paramRowCount}`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: ${error}`, 'Y', 'Y');

	// 			return res.end(JSON.stringify({
	// 				status: 500,
	// 				result: 'error',
	// 				message: '조회에 실패하였습니다.',
	// 				data: error
	// 			}));
	// 		} else {
	// 			if (Object.keys(response).length == 0) {
	// 				func.setLog(`[Error] RESTful API > ${req.url}: 조회된 내용이 없습니다.`, 'Y', 'N');
	// 				func.setLog(`[Error] RESTful API > ${req.url}: @paramCategory: ${paramCategory}`, 'Y', 'N');
	// 				func.setLog(`[Error] RESTful API > ${req.url}: @paramRowCount: ${paramRowCount}`, 'Y', 'N');
	
	// 				return res.end(JSON.stringify({
	// 					status: 204,
	// 					result: 'nothing',
	// 					message: '조회된 내용이 없습니다.',
	// 					data: response
	// 				}));
	// 			} else {
	// 				func.setLog(`[Log] RESTful API > ${req.url}: 조회하였습니다.`, 'Y', 'N');
	// 				func.setLog(`[Log] RESTful API > ${req.url}: @paramCategory: ${paramCategory}`, 'Y', 'N');
	// 				func.setLog(`[Log] RESTful API > ${req.url}: @paramRowCount: ${paramRowCount}`, 'Y', 'N');

	// 				return res.end(JSON.stringify({
	// 					status: 200,
	// 					result: 'success',
	// 					message: '조회하였습니다.',
	// 					data: response
	// 				}));
	// 			}
	// 		}
	// 	});
	// });

	// /*
	//  * 월별알람(탭용) 목록을 불러옴
	//  */
	// app.post('/api/get/alarm_month_list', (req, res) => {
	// 	// 받은 인자값을 정의함
	// 	const paramCategory = req.body.category;	// 설비 종류
	// 	const paramRowCount = req.body.row_count;	// 불러올 행 갯수

	// 	// 인자값 배열을 생성함(? 순서대로 입력함)
	// 	const arrParamData = [
	// 	];

	// 	// 데이터를 불러옴
	// 	let query = db.query(`
	// 		SELECT	seq,
	// 				col1,
	// 				col2,
	// 				col3,
	// 				col4,
	// 				col5
	// 		FROM	alarm_month
	// 		WHERE	lower(replace(col1, '-', '')) LIKE concat('%', lower('${paramCategory}'), '%')
	// 		ORDER	BY seq DESC
	// 		LIMIT	${paramRowCount}
	// 	`, arrParamData, (error, response) => {
	// 		if (error) {
	// 			func.setLog(`[Error] RESTful API > ${req.url}: 조회에 실패하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: @paramCategory: ${paramCategory}`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: @paramRowCount: ${paramRowCount}`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: ${error}`, 'Y', 'Y');

	// 			return res.end(JSON.stringify({
	// 				status: 500,
	// 				result: 'error',
	// 				message: '조회에 실패하였습니다.',
	// 				data: error
	// 			}));
	// 		} else {
	// 			if (Object.keys(response).length == 0) {
	// 				func.setLog(`[Error] RESTful API > ${req.url}: 조회된 내용이 없습니다.`, 'Y', 'N');
	// 				func.setLog(`[Error] RESTful API > ${req.url}: @paramCategory: ${paramCategory}`, 'Y', 'N');
	// 				func.setLog(`[Error] RESTful API > ${req.url}: @paramRowCount: ${paramRowCount}`, 'Y', 'N');
	
	// 				return res.end(JSON.stringify({
	// 					status: 204,
	// 					result: 'nothing',
	// 					message: '조회된 내용이 없습니다.',
	// 					data: response
	// 				}));
	// 			} else {
	// 				func.setLog(`[Log] RESTful API > ${req.url}: 조회하였습니다.`, 'Y', 'N');
	// 				func.setLog(`[Log] RESTful API > ${req.url}: @paramCategory: ${paramCategory}`, 'Y', 'N');
	// 				func.setLog(`[Log] RESTful API > ${req.url}: @paramRowCount: ${paramRowCount}`, 'Y', 'N');

	// 				return res.end(JSON.stringify({
	// 					status: 200,
	// 					result: 'success',
	// 					message: '조회하였습니다.',
	// 					data: response
	// 				}));
	// 			}
	// 		}
	// 	});
	// });

	// /*
	//  * 장비의 가동율(초 단위) 목록을 불러옴
	//  */
	// app.post('/api/get/run_history_list', (req, res) => {
	// 	// 받은 인자값을 정의함
	// 	const paramSearchDate = req.body.search_date;	// 조회 일자(00000000)
	// 	const paramRunType = req.body.run_type;			// 설비 상태(0: 작동, 1: 멈춤, 2: 장애멈춤)

	// 	// 인자값 배열을 생성함(? 순서대로 입력함)
	// 	const arrParamData = [
	// 	];

	// 	// 데이터를 불러옴
	// 	let query = db.query(`
	// 		SELECT	a3.col1 AS object_name,
	// 				sum(a3.between_sec) AS run_sec,
	// 				time_to_sec(timediff(if(a3.chk_today = 1, now(), a3.search_date), min(a3.start_date))) AS all_sec
	// 		FROM	(
	// 					SELECT	a2.col1,
	// 							a2.col2 AS start_date,
	// 							if(a2.end_date IS null, if(a2.chk_today = 1, now(), a2.search_date), a2.end_date) AS end_date,
	// 							time_to_sec(timediff(if(a2.end_date IS null, if(a2.chk_today = 1, now(), a2.search_date), a2.end_date), a2.col2)) AS between_sec,
	// 							a2.col3,
	// 							a2.chk_today,
	// 							a2.search_date
	// 					FROM	(
	// 								SELECT	a.*,
	// 										(
	// 											SELECT	col2
	// 											FROM	run_history
	// 											WHERE	col2 >= str_to_date('${paramSearchDate}000000', '%Y%m%d%H%i%s')
	// 													AND col2 < date_add(str_to_date('${paramSearchDate}', '%Y%m%d'), interval 1 day)
	// 													AND col1 = a.col1
	// 													AND seq > a.seq
	// 											ORDER	BY seq
	// 											LIMIT	1
	// 										) AS end_date,
	// 										if(str_to_date('${paramSearchDate}', '%Y%m%d') = curdate(), 1, 0) AS chk_today,
	// 										str_to_date('${paramSearchDate}235959', '%Y%m%d%H%i%s') AS search_date
	// 								FROM	run_history a
	// 								WHERE	a.col2 >= str_to_date('${paramSearchDate}000000', '%Y%m%d%H%i%s')
	// 										AND a.col2 < date_add(str_to_date('${paramSearchDate}', '%Y%m%d'), interval 1 day)
	// 										AND a.col3 = ${paramRunType}
	// 							) a2
	// 				) a3
	// 		GROUP	BY a3.col1
	// 	`, arrParamData, (error, response) => {
	// 		if (error) {
	// 			func.setLog(`[Error] RESTful API > ${req.url}: 조회에 실패하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: @paramSearchDate: ${paramSearchDate}`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: @paramRunType: ${paramRunType}`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: ${error}`, 'Y', 'Y');

	// 			return res.end(JSON.stringify({
	// 				status: 500,
	// 				result: 'error',
	// 				message: '조회에 실패하였습니다.',
	// 				data: error
	// 			}));
	// 		} else {
	// 			if (Object.keys(response).length == 0) {
	// 				func.setLog(`[Error] RESTful API > ${req.url}: 조회된 내용이 없습니다.`, 'Y', 'N');
	// 				func.setLog(`[Error] RESTful API > ${req.url}: @paramSearchDate: ${paramSearchDate}`, 'Y', 'N');
	// 				func.setLog(`[Error] RESTful API > ${req.url}: @paramRunType: ${paramRunType}`, 'Y', 'N');
	
	// 				return res.end(JSON.stringify({
	// 					status: 204,
	// 					result: 'nothing',
	// 					message: '조회된 내용이 없습니다.',
	// 					data: response
	// 				}));
	// 			} else {
	// 				func.setLog(`[Log] RESTful API > ${req.url}: 조회하였습니다.`, 'Y', 'N');
	// 				func.setLog(`[Log] RESTful API > ${req.url}: @paramSearchDate: ${paramSearchDate}`, 'Y', 'N');
	// 				func.setLog(`[Log] RESTful API > ${req.url}: @paramRunType: ${paramRunType}`, 'Y', 'N');

	// 				return res.end(JSON.stringify({
	// 					status: 200,
	// 					result: 'success',
	// 					message: '조회하였습니다.',
	// 					data: response
	// 				}));
	// 			}
	// 		}
	// 	});
	// });

	// /*
	//  * 장비의 가동율(초 단위) 목록을 불러옴(오늘을 기준으로 7일치 이전 데이터를 불러옴)
	//  */
	// app.post('/api/get/run_history_ago_list', (req, res) => {
	// 	// 인자값 배열을 생성함(? 순서대로 입력함)
	// 	const arrParamData = [
	// 	];

	// 	// 데이터를 불러옴
	// 	let query = db.query(`
	// 		SELECT	a3.col1 AS object_name,
	// 				date_format(start_date, '%Y%m%d') AS that_full_date,
	// 				date_format(start_date, '%m-%d') AS that_date,
	// 				a3.col3,
	// 				sum(a3.between_sec) AS run_sec,
	// 				-- time_to_sec(timediff(max(a3.end_date), min(a3.start_date))) AS all_sec,
	// 				86400 AS all_sec,
	// 				round(sum(a3.between_sec) / 86400 * 100, 2) AS run_rate
	// 		FROM	(
	// 					SELECT	a2.col1,
	// 							a2.col2 AS start_date,
	// 							if(a2.end_date IS null, if(a2.chk_today = 1, now(), a2.search_date), a2.end_date) AS end_date,
	// 							time_to_sec(timediff(if(a2.end_date IS null, if(a2.chk_today = 1, now(), a2.search_date), a2.end_date), a2.col2)) AS between_sec,
	// 							a2.col3,
	// 							a2.chk_today,
	// 							a2.search_date
	// 					FROM	(
	// 								SELECT	a.*,
	// 										(
	// 											SELECT	col2
	// 											FROM	run_history
	// 											WHERE	date_format(col2, '%Y%m%d') = date_format(a.col2, '%Y%m%d')
	// 													AND col1 = a.col1
	// 													AND seq > a.seq
	// 											ORDER	BY seq
	// 											LIMIT	1
	// 										) AS end_date,
	// 										if(date_format(a.col2, '%Y%m%d') = date_format(curdate(), '%Y%m%d'), 1, 0) AS chk_today,
	// 										str_to_date(concat(date_format(a.col2, '%Y%m%d'), '235959'), '%Y%m%d%H%i%s') AS search_date
	// 								FROM	run_history a
	// 								WHERE	a.col2 > date_add(curdate(), interval -8 day)
	// 										AND a.col2 < date_add(curdate(), interval 1 day)
	// 										-- AND a.col3 = 0
	// 							) a2
	// 				) a3
	// 		GROUP	BY a3.col1,
	// 				that_date,
	// 				a3.col3
	// 		ORDER	BY that_date,
	// 				a3.col1,
	// 				a3.col3
	// 	`, arrParamData, (error, response) => {
	// 		if (error) {
	// 			func.setLog(`[Error] RESTful API > ${req.url}: 조회에 실패하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: ${error}`, 'Y', 'Y');

	// 			return res.end(JSON.stringify({
	// 				status: 500,
	// 				result: 'error',
	// 				message: '조회에 실패하였습니다.',
	// 				data: error
	// 			}));
	// 		} else {
	// 			if (Object.keys(response).length == 0) {
	// 				func.setLog(`[Error] RESTful API > ${req.url}: 조회된 내용이 없습니다.`, 'Y', 'N');
	
	// 				return res.end(JSON.stringify({
	// 					status: 204,
	// 					result: 'nothing',
	// 					message: '조회된 내용이 없습니다.',
	// 					data: response
	// 				}));
	// 			} else {
	// 				func.setLog(`[Log] RESTful API > ${req.url}: 조회하였습니다.`, 'Y', 'N');


	// 				return res.end(JSON.stringify({
	// 					status: 200,
	// 					result: 'success',
	// 					message: '조회하였습니다.',
	// 					data: response
	// 				}));
	// 			}
	// 		}
	// 	});
	// });

	// /*
	//  * 장비의 작동 상태를 저장함
	//  */
	// app.post('/api/set/insert_run_history', (req, res) => {
	// 	// 받은 인자값을 정의함
	// 	const paramObjectName = req.body.object_name;	// 설비 이름
	// 	const paramRunType = req.body.run_type;			// 설비 상태(0: 작동, 1: 멈춤, 2: 장애멈춤)

	// 	// 인자값 배열을 생성함(? 순서대로 입력함)
	// 	const arrParamData = [
	// 	];

	// 	// 데이터를 불러옴
	// 	let query = db.query(`
	// 		INSERT	INTO run_history
	// 				(
	// 					col1,
	// 					col3
	// 				)
	// 		VALUES	(
	// 					'${paramObjectName}',
	// 					'${paramRunType}'
	// 				)
	// 	`, arrParamData, (error, response) => {
	// 		if (error) {
	// 			func.setLog(`[Error] RESTful API > ${req.url}: 저장에 실패하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: @paramObjectName: ${paramObjectName}`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: @paramRunType: ${paramRunType}`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: ${error}`, 'Y', 'Y');

	// 			return res.end(JSON.stringify({
	// 				status: 500,
	// 				result: 'error',
	// 				message: '저장에 실패하였습니다.',
	// 				data: error
	// 			}));
	// 		} else {
	// 			func.setLog(`[Log] RESTful API > ${req.url}: 저장하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Log] RESTful API > ${req.url}: @paramObjectName: ${paramObjectName}`, 'Y', 'N');
	// 			func.setLog(`[Log] RESTful API > ${req.url}: @paramRunType: ${paramRunType}`, 'Y', 'N');

	// 			return res.end(JSON.stringify({
	// 				status: 200,
	// 				result: 'success',
	// 				message: '저장하였습니다.',
	// 				data: response
	// 			}));
	// 		}
	// 	});
	// });

	// /*
	//  * 기간별 생산량에 +1 처리함
	//  */
	// app.post('/api/set/insert_output_between', (req, res) => {
	// 	// 받은 인자값을 정의함
	// 	const paramRunRate = req.body.run_rate;	// 가동률(%)

	// 	// 인자값 배열을 생성함(? 순서대로 입력함)
	// 	const arrParamData = [
	// 	];

	// 	// 데이터를 불러옴
	// 	let query = db.query(`
	// 		INSERT	INTO output_between
	// 				(
	// 					seq,
	// 					col1,
	// 					col2
	// 				)
	// 		VALUES	(
	// 					date_format(curdate(), '%Y%m%d'),
	// 					${paramRunRate},
	// 					1
	// 				)
	// 		ON		DUPLICATE KEY UPDATE seq = date_format(curdate(), '%Y%m%d'),
	// 				col1 = ${paramRunRate},
	// 				col2 = col2 + 1
	// 	`, arrParamData, (error, response) => {
	// 		if (error) {
	// 			func.setLog(`[Error] RESTful API > ${req.url}: 저장에 실패하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: @paramRunRate: ${paramRunRate}`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: ${error}`, 'Y', 'Y');

	// 			return res.end(JSON.stringify({
	// 				status: 500,
	// 				result: 'error',
	// 				message: '저장에 실패하였습니다.',
	// 				data: error
	// 			}));
	// 		} else {
	// 			func.setLog(`[Log] RESTful API > ${req.url}: 저장하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Log] RESTful API > ${req.url}: @paramRunRate: ${paramRunRate}`, 'Y', 'N');

	// 			return res.end(JSON.stringify({
	// 				status: 200,
	// 				result: 'success',
	// 				message: '저장하였습니다.',
	// 				data: response
	// 			}));
	// 		}
	// 	});
	// });

	// /*
	//  * 현재 적치/반출 목록을 불러옴(오늘 날짜 1개만)
	//  */
	// app.post('/api/get/inout_state_one', (req, res) => {
	// 	// 인자값 배열을 생성함(? 순서대로 입력함)
	// 	const arrParamData = [
	// 	];

	// 	// 데이터를 불러옴
	// 	let query = db.query(`
	// 		SELECT	seq,
	// 				col1,
	// 				col2
	// 		FROM	inout_state
	// 		WHERE	seq = date_format(now(), '%Y%m%d')
	// 		LIMIT	1
	// 	`, arrParamData, (error, response) => {
	// 		if (error) {
	// 			func.setLog(`[Error] RESTful API > ${req.url}: 조회에 실패하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: ${error}`, 'Y', 'Y');

	// 			return res.end(JSON.stringify({
	// 				status: 500,
	// 				result: 'error',
	// 				message: '조회에 실패하였습니다.',
	// 				data: error
	// 			}));
	// 		} else {
	// 			if (Object.keys(response).length == 0) {
	// 				func.setLog(`[Error] RESTful API > ${req.url}: 조회된 내용이 없습니다.`, 'Y', 'N');
	
	// 				return res.end(JSON.stringify({
	// 					status: 204,
	// 					result: 'nothing',
	// 					message: '조회된 내용이 없습니다.',
	// 					data: response
	// 				}));
	// 			} else {
	// 				func.setLog(`[Log] RESTful API > ${req.url}: 조회하였습니다.`, 'Y', 'N');

	// 				return res.end(JSON.stringify({
	// 					status: 200,
	// 					result: 'success',
	// 					message: '조회하였습니다.',
	// 					data: response
	// 				}));
	// 			}
	// 		}
	// 	});
	// });

	// /*
	//  * 오늘 날짜에 현재 적치/반출을 저장함
	//  */
	// app.post('/api/set/inout_state_up', (req, res) => {
	// 	// 받은 인자값을 정의함
	// 	const paramIn = req.body.in;	// 적치
	// 	const paramOut = req.body.out;	// 반출

	// 	// 인자값 배열을 생성함(? 순서대로 입력함)
	// 	const arrParamData = [
	// 	];

	// 	// 데이터를 불러옴
	// 	let query = db.query(`
	// 		INSERT	INTO inout_state
	// 				(
	// 					seq,
	// 					col1,
	// 					col2
	// 				)
	// 		VALUES	(
	// 					date_format(curdate(), '%Y%m%d'),
	// 					${paramIn},
	// 					${paramOut}
	// 				)
	// 		ON		DUPLICATE KEY UPDATE seq = date_format(curdate(), '%Y%m%d'),
	// 				col1 = ${paramIn},
	// 				col2 = ${paramOut}
	// 	`, arrParamData, (error, response) => {
	// 		if (error) {
	// 			func.setLog(`[Error] RESTful API > ${req.url}: 저장에 실패하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: @paramIn: ${paramIn}`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: @paramOut: ${paramOut}`, 'Y', 'N');
	// 			func.setLog(`[Error] RESTful API > ${req.url}: ${error}`, 'Y', 'Y');

	// 			return res.end(JSON.stringify({
	// 				status: 500,
	// 				result: 'error',
	// 				message: '저장에 실패하였습니다.',
	// 				data: error
	// 			}));
	// 		} else {
	// 			func.setLog(`[Log] RESTful API > ${req.url}: 저장하였습니다.`, 'Y', 'N');
	// 			func.setLog(`[Log] RESTful API > ${req.url}: @paramIn: ${paramIn}`, 'Y', 'N');
	// 			func.setLog(`[Log] RESTful API > ${req.url}: @paramOut: ${paramOut}`, 'Y', 'N');

	// 			return res.end(JSON.stringify({
	// 				status: 200,
	// 				result: 'success',
	// 				message: '저장하였습니다.',
	// 				data: response
	// 			}));
	// 		}
	// 	});
	// });












	// 쿼리를 실행하여 데이터를 불러옴
	// @dbType: c62a, cj01
	const executeQuery = (dbType, query, callback) => {
		let dbConn = null;
		let dbInfo = null;

		// DB 접속 정보를 선택함
		switch (dbType) {
			case 'C62A':
				dbInfo = config.dbInfo1;
				break;

			case 'CJ01':
				dbInfo = config.dbInfo2;
				break;

			case 'ERPUSER':
				dbInfo = config.dbInfo3;
				break;
		}

		try {
			// dbConn = oracledb.getConnection(
			// 	dbInfo,
			// 	(err, db) => {
			// 		if (err) {
			// 			func.setLog(`[Error #DB] oracledb.getConnection(): 데이터베이스에 접속할 수 없습니다. - ${dbInfo.connectString}.${dbInfo.user}`, 'Y', 'N');
			// 			func.setLog(`[Error #DB] oracledb.getConnection(): ${err.message}`, 'Y', 'N');

			// 			callback(false, null);
			// 		}
				
			// 		db.execute(query, (err, result) => {
			// 			if (err) {
			// 				func.setLog(`[Error #DB] oracledb.execute(): 쿼리 실행에 실패하였습니다. - ${dbInfo.connectString}.${dbInfo.user}`, 'Y', 'N');
			// 				func.setLog(`[Error #DB] oracledb.execute(): ${err.message}`, 'Y', 'N');

			// 				callback(false, null);
			// 			} else {
			// 				callback(true, result.rows);
			// 			}
			// 		});
			// 	}
			// );
		} catch (err) {
			func.setLog(`[Error #DB] oracledb.getConnection(): 데이터베이스에 접속할 수 없습니다. - ${dbInfo.connectString}.${dbInfo.user}`, 'Y', 'N');
			func.setLog(`[Error #DB] oracledb.getConnection(): ${err}`, 'Y', 'N');

			callback(false, null);
		} finally {
			if (dbConn) {
				try {
					dbConn.close();
				} catch (err) {
					func.setLog(`[Error #DB] oracledb.close(): 데이터베이스 종료에 실패하였습니다. - ${dbInfo.connectString}.${dbInfo.user}`, 'Y', 'N');
					func.setLog(`[Error #DB] oracledb.close(): ${err.message}`, 'Y', 'N');

					callback(false, null);
				}
			}
	  	}
	}

	// 쿼리를 실행한 후, 데이터를 사용자에게 전송함
	// @runType: get: SELECT, set: INSERT, UPDATE, DELETE
	const sendData = (runType, res, resultType, data) => {
		try {
			switch (runType) {
				// SELECT
				case 'get':
					if (resultType) {
						// 실행을 완료함
						if (Object.keys(data).length > 0) {
							return res.end(JSON.stringify({
								status: 200,
								result: 'success',
								message: '조회하였습니다.',
								data: data
							}));
						} else {
							return res.end(JSON.stringify({
								status: 204,
								result: 'nothing',
								message: '조회된 내용이 없습니다.',
								data: data
							}));
						}
					} else {
						// 실행이 실패함
						return res.end(JSON.stringify({
							status: 500,
							result: 'error',
							message: '조회에 실패하였습니다.',
							data: data
						}));
					}
					break;
	
				// INSERT, UPDATE, DELETE
				case 'set':
					if (resultType) {
						// 실행을 완료함
						return res.end(JSON.stringify({
							status: 200,
							result: 'success',
							message: '실행하였습니다.',
							data: data
						}));
					} else {
						// 실행이 실패함
						return res.end(JSON.stringify({
							status: 500,
							result: 'error',
							message: '실행에 실패하였습니다.',
							data: data
						}));
					}
					break;
			}
		} catch (error) {
		console.log(error);
		}
	}
















	/* ********** ********** ********** ********** ********** ********** ********** ********** ********** ********** *
	 *
	 * Section: 사용자 정의 함수
	 *
	 * ********** ********** ********** ********** ********** ********** ********** ********** ********** ********** */

	// 날짜 문자열을 반환함
	function getDateText(d) {
		return (getLeadingZeros(d.getFullYear(), 4) + '.' + getLeadingZeros(d.getMonth() + 1, 2) + '.' + getLeadingZeros(d.getDate(), 2) + ' ' + getLeadingZeros(d.getHours(), 2) + ':' + getLeadingZeros(d.getMinutes(), 2) + ':' + getLeadingZeros(d.getSeconds(), 2));
	}
	function getLeadingZeros(n, digits) {
		let zero = '';
		n = n.toString();

		if (n.length < digits) {
			for (i = 0; i < digits - n.length; i++) {
				zero += '0';
			}
		}

		return zero + n;
	}
}
