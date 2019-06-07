/*
 *
 * Title: LayoutMonitoring Function Module
 * Date: 2019.01.16
 *
 */



/*
 * Module 정의
 */

module.exports = {
	// 콘솔에 로그를 출력함
	// @paramText: 로그로 출력할 문자열
	// @paramShowDateType: 로그 문자열 앞에 현재 일시를 출력할지에 대한 여부(Y: 출력함, N: 출력안함)
	// @paramAddNewLineType: 로그를 출력한 후, 다음 행에 빈 행을 추가하여 출력할지에 대한 여부(Y: 출력함, N: 출력안함)
	setLog: (paramText, paramShowDateType, paramAddNewLineType) => {
		let valText = '';

		if (paramShowDateType == 'Y') {
			valText = getDateText(new Date()) + ' ';
		}

		console.log(valText + paramText);

		if (paramAddNewLineType == 'Y') {
			console.log('');
		}
	},
	// 날짜 문자열을 반환함
	// @paramDatetime: 문자열로 변경할 일시
	getDateText: paramDatetime => {
		getDateText(paramDatetime);
	}
};



/*
 * 모듈 내부용 함수
 */

// 날짜 문자열을 반환함
// @paramDatetime: 문자열로 변경할 일시
const getDateText = paramDatetime => {
	return (getLeadingZeros(paramDatetime.getFullYear(), 4) + '.' + getLeadingZeros(paramDatetime.getMonth() + 1, 2) + '.' + getLeadingZeros(paramDatetime.getDate(), 2) + ' ' + getLeadingZeros(paramDatetime.getHours(), 2) + ':' + getLeadingZeros(paramDatetime.getMinutes(), 2) + ':' + getLeadingZeros(paramDatetime.getSeconds(), 2));
};
const getLeadingZeros = (n, digits) => {
	let zero = '';
	n = n.toString();

	if (n.length < digits) {
		for (let i = 0; i < digits - n.length; i++) {
			zero += '0';
		}
	}

	return zero + n;
};

