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
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const socketIO = require('socket.io');
const fs = require('fs');

// 추가 모듈을 불러옴
// const config = require('./config.module.js');
const func = require('./function.module.js');

// 소켓서버 접속 포트를 정의함
// const socketPort = config.socketInfo.port;

// 환경설정을 정의함
let config = {
	address: {},
	database: {}
};

// 쿼리를 정의함
let query = {};



// Express Middleware를 정의함
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

// JSON 인자값의 오류를 확인함
app.use((error, req, res, next) => {
	//console.log(error.stack);

	res.end(JSON.stringify({
		status: 400,
		result: 'error',
		message: 'JSON 형식에 오류가 있거나 서버 오류일 수 있습니다.',
		data: null
	}));
});

// 도메인 보안 오류를 무시함
app.use(cors({
	'allowedHeaders': ['sessionId', 'Content-Type'],
	'exposedHeaders': ['sessionId'],
	'origin': '*',
	'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
	'preflightContinue': false
}));



// 서버 JSON 파일을 불러옴
try {
	// 텍스트 파일을 불러옴
	const data = fs.readFileSync(path.join(__dirname, 'json/address.config.json'), 'utf8');
	const jsonData = JSON.parse(data);

	config.address = jsonData;
} catch (error) {
	console.log('서버 JSON 파일 읽기에 실패하였습니다.');
	console.log(error);
}

// Database JSON 파일을 불러옴
try {
	// 텍스트 파일을 불러옴
	const data = fs.readFileSync(path.join(__dirname, 'json/database.config.json'), 'utf8');
	const jsonData = JSON.parse(data);

	config.database = jsonData;
} catch (error) {
	console.log('Database JSON 파일 읽기에 실패하였습니다.');
	console.log(error);
}

// Query JSON 파일을 불러옴
try {
	// 텍스트 파일을 불러옴
	const data = fs.readFileSync(path.join(__dirname, 'json/query.json'), 'utf8');
	const jsonData = JSON.parse(data);

	query = jsonData;
} catch (error) {
	console.log('Query JSON 파일 읽기에 실패하였습니다.');
	console.log(error);
}



// // 공장 장비의 현재 정보를 저장함
// let objectData = new Array();



const server = app.listen(config.address.socket.port, error => {
	if (error) {
		func.setLog('[Error #SC-001] http.listen(): 소켓 서버를 시작할 수 없습니다.', 'Y', 'N');
		func.setLog('[Error #SC-001] http.listen(): ' + error.stack, 'Y', 'Y');

		return;
	}

	func.setLog('[Log #SC-101] http.listen(): 소켓 서버를 시작하였습니다.', 'Y', 'N');
	func.setLog('[Log #SC-101] http.listen(): Socket Port: ' + config.address.socket.port, 'Y', 'Y');
});

const io = socketIO(server);



/*
 * Route 정의
 */

 // RESTful API 페이지로 접속함
const router = require('./routes')(app, io, { config: config, query: query }, (result) => {
	// RESTful API로부터 데이터를 받아서 처리함
	switch (result.callType) {
		// 크레인 정보
		case 'CraneState':
			// 크레인 정보를 추가함
			setCraneData(result.data);
			break;
	}
});



/*
 * Socket 신호 처리
 */

// 현재 접속되어 있는 사용자들을 기억함
let _arrConnectedUser = [];

// 접속한 사용자마다 고유번호를 지정함
let seqConnectedUser = 1;

// 소켓 접속을 처리함
io.on('connection', socket => {
	/**
	 * socket.on: 이벤트를 받을 때
	 * io.emit: 이벤트를 보낼 때
	 * io.to(socket.id).emit: 특정 사용자에게 이벤트를 보낼 때
	 * socket.broadcast.emit: 이벤트를 보낸 사용자를 제외한 나머지 사용자에게 이벤트를 보낼 때
	 */

	// 새 사용자가 접속함
    // 접속한 사용자의 socket.id로 새 사용자 이름을 전송함
	func.setLog('[Event] 사용자 접속: ' + socket.id, 'Y', 'N');

	// 임시!
	io.to(socket.id).emit('abc', {
		socketID: socket.id		// Socket ID
	});

	// 접속한 사용자에게 접속 코드를 요청함
	io.to(socket.id).emit('requireConnectionInfo', null);

	// 사용자로부터 접속 코드를 받음
	socket.on('connectionInfo', data => {
		data.socketId = socket.id;

		try {
			//let userInfo = _arrConnectedUser.filter(object => object.connectType === 'Main' && object.socketId === socket.id);

			//_arrConnectedUser = _arrConnectedUser.filter(object => object.connectType != data.connectType && object.userSocketCode != userInfo.userSocketCode);
			_arrConnectedUser.push(data);
			// console.log(_arrConnectedUser);
			// console.log('----------');
		} catch {
		}
	});

	// Unity에서 선택한 부품 코드를 사용자의 iframe으로 보냄
	socket.on('selectedPart', data => {
		try {
			let userInfo = _arrConnectedUser.filter(object => object.connectType === 'Main' && object.socketId === socket.id);
			let userIframeInfo = _arrConnectedUser.filter(object => object.connectType === 'MainDetailUnity' && object.userSocketCode === userInfo[0].userSocketCode);
	
			if (userIframeInfo.length == 0) {
				return;
			} else {
				userIframeInfo = userIframeInfo[0];
			}
	
			// 사용자의 iframe으로 데이터를 보냄
			io.to(userIframeInfo.socketId).emit('selectedPart', data);
		} catch {
		}
	});

	// 임시!
	socket.on('def', data => {
		//func.setLog('테스트: ' + data, 'Y', 'N');
	});

	





	// 웹 Unity로부터 받은 공장 장비의 상태를 모든 접속 사용자에게 보냄
	// socket.on('objectRealPosition', data => {
	// 	//func.setLog(`ForwardMove${data.objectNo}: ${data.x}:${data.y}:${data.z}`, 'Y', 'N');

	// 	// 접속한 모든 사용자에게 좌표 정보를 보냄
	// 	/*
	// 	io.emit('ObjectPosition', {
	// 		objectName: 'ForwardMove',
	// 		objectNo: data.objectNo,
	// 		x: data.x,
	// 		y: data.y,
	// 		z: data.z
	// 	});
	// 	*/

	// 	// 값을 보정함
	// 	if (data.x == '00') {
	// 		data.x = '0';
	// 	}
	// 	if (data.y == '00') {
	// 		data.y = '0';
	// 	}
	// 	if (data.z == '00') {
	// 		data.z = '0';
	// 	}

	// 	// 이전 데이터와 동일한 데이터를 받으면 무효로 처리함
	// 	let chkDuplicate = false;

	// 	// 이전 데이터와 동일한 데이터를 받으면 무효로 처리함
	// 	if (objectData[`${data.objectName}${data.objectNo}`]) {
	// 		let tmpCount = 0;

	// 		if (objectData[`${data.objectName}${data.objectNo}`].x == data.x) {
	// 			tmpCount += 1;
	// 		}
	// 		if (objectData[`${data.objectName}${data.objectNo}`].y == data.y) {
	// 			tmpCount += 1;
	// 		}
	// 		if (objectData[`${data.objectName}${data.objectNo}`].z == data.z) {
	// 			tmpCount += 1;
	// 		}

	// 		if (tmpCount == 3) {
	// 			chkDuplicate = true;
	// 		}
	// 	}

	// 	/*
	// 	// 이전 데이터와 동일한 데이터를 받으면 무효로 처리함
	// 	if (chkDuplicate) {
	// 		return;
	// 	}
	// 	*/

	// 	// 공장 장비 중, 방금 받은 데이터와 일치하는 데이터를 삭제함
	// 	if (objectData.hasOwnProperty(`${data.objectName}${data.objectNo}`)) {
	// 		delete objectData[`${data.objectName}${data.objectNo}`];
	// 	}

	// 	// 공장 장비에 방금 받은 데이터를 추가함
	// 	objectData[`${data.objectName}${data.objectNo}`] = data;
		
	// 	// 20190314 : VR의 데이터 받기 성능 저하로 아래의 소스는 주석으로 처리함(한꺼번에 보내는 방식으로 변경함)
	// 	// 접속한 모든 사용자에게 좌표 정보를 보냄
	// 	//io.emit('ObjectPosition', `0,${data.objectName},${data.objectNo},${data.x},${data.y},${data.z},0`);
	// });
	


	socket.on('error', () => {
		func.setLog('[Error] Socket error: ' + socket.id, 'Y', 'N');
	});

	// 사용자가 접속을 끊음
	socket.on('disconnect', () => {
		// // 접속한 사용자 목록에서 해당 사용자의 배열 순서를 불러옴
		// let idxSocketID = _arrConnectedUser.filter((object) => {
		// 	return object['socketID'] === socket.id;
		// });

		// // 접속한 사용자 목록에서 해당 사용자를 삭제함
		// _arrConnectedUser.splice(_arrConnectedUser.indexOf(idxSocketID), 1);

		try {
			// 접속 해제한 사용자를 목록에서 삭제함
			let userInfo = _arrConnectedUser.filter(object => object.socketId === socket.id);

			if (userInfo.length == 0) {
				return;
			}

			userInfo = userInfo[0];
			_arrConnectedUser = _arrConnectedUser.filter(object => object.userSocketCode !== userInfo.userSocketCode);

			// console.log(_arrConnectedUser);
			// console.log('----------');
		} catch {
		}

		func.setLog('[Event] 사용자 접속 해제: ' + socket.id, 'Y', 'N');
	});

	/* ********** ********** ********** ********** ********** ********** ********** ********** ********** ********** *
	 *
	 * Section: Socket - Send
	 *
	 * ********** ********** ********** ********** ********** ********** ********** ********** ********** ********** */

	// 소켓에 새로운 접속이 발생하면 사용자의 웹브라우저로 소켓ID를 보냄
	// 소켓에 접속하면 웹브라우저로 신호를 보냄 → 웹브라우저가 사용자 정보를 소켓으로 보냄 → 최종 사용자 정보를 사용자 배열에 추가함
	// *Socket.io → Web
	io.to(socket.id).emit('StoW_ConnectedUser', {
		socketID: socket.id		// Socket ID
	});
});



// /*
//  * 크레인 정보 처리
//  */

// // 크레인 정보를 저장함
// let craneData = [];

// // 크레인 정보를 추가함
// const setCraneData = data => {
// 	/*
// 	{
// 		"craneId": "AC659",			// Crane ID
// 		"Xrange": 13.99,			// 종축 방향 거리
// 		"Y1range": 4.82,			// 거더 위 호이스트 1번 거리
// 		"Y2range": 21.9,			// 거더 위 호이스트 2번 거리
// 		"firLoadcell": 0,			// 1번 로드셀 무게
// 		"secLoadcell": 0,			// 2번  로드셀 무게
// 		"loadcellTotal": 1,			// 로드셀 총합
// 		"auxLoadcell": 1 			// aux 로드셀 무게
// 		"kalmanLoadcellTotal": 1,	// 칼만 필터 적용한 로드셀 무게 (튀는 값 잘라내는 필터 적용한 값)
// 		"kalmanFirLoadcell": 0,		// 칼만 필터 적용한 로드셀 무게 (튀는 값 잘라내는 필터 적용한 값)
// 		"kalmanSecLoadcell": 0,		// 칼만 필터 적용한 로드셀 무게 (튀는 값 잘라내는 필터 적용한 값)
// 		"kalmanAuxLoadcell": 1,		// 칼만 필터 적용한 로드셀 무게 (튀는 값 잘라내는 필터 적용한 값)
// 		"timestamp": 1555315754000	// Unix Timestamp 유닉스 시간
// 	}
// 	*/

// 	// 새로운 정보로 수정함
// 	craneData = craneData.filter(object => object.craneId != data.craneId);

// 	// 정보를 추가함
// 	craneData.push(data);
// }

// // 크레인 정보를 모든 접속 사용자들에게 보냄
// const sendCraneData = () => {
// 	if (craneData.length > 0) {
// 		io.emit('CraneState', craneData);
// 	}
// }
