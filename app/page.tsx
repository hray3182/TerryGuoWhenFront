'use client'
import { useState, useEffect, useRef } from 'react';
import { User } from './module/user';
import useWebSocket, { SendMessage } from 'react-use-websocket';
import { Game } from './module/game';
// global.css
import './globals.css';
const socketUrl = 'wss://trerryguowhenapi.zeabur.app/ws';

interface Response {
  action: string;
  status: string;
  data: string;
}

interface Request {
  action: string;
  data: string;
}

interface betting {
  nums: number[];
  amount: number;
}

interface betResult {
  state: string;
  msg: string;
}

interface earnInfo {
  game_id: string;
  game_nums: string;
  user_nums: string;
  bet_amount: number;
  earn_amount: number;
}

interface topUser {
  username: string;
  balance: number;
}

interface gameHistory {
  game_id: string;
  game_nums: number[];
}

  // 將數字轉換成中文單位
  // 萬、億、兆、京、垓、秭、穰、溝、澗、正、載
  const numToChinese = (num: number) => {
    const units = ['','萬', '億', '兆', '京', '垓', '秭', '穰', '溝', '澗', '正', '載'];
    let unit = 0;
    while (num > 10000) {
      num = num / 10000;
      unit++;
    }
    return num.toFixed(2) + units[unit];
  }

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);
  const [logined, setLogined] = useState(false)
  const [registerMsg, setRegisterMsg] = useState('')
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [bettingResult, setBettingResult] = useState<betResult | null>(null);
  const [currentBettings, setCurrentBettings] = useState<betting[]>([])
  const [earnInfos, setEarnInfos] = useState<earnInfo[]>([])
  const [topUsers, setTopUsers] = useState<topUser[]>([])
  const [gameHistory, setGameHistory] = useState<gameHistory[]>([])
  const [restTime, setRestTime] = useState(0)


  const login = () => {
    // load user from local storage
    const data = localStorage.getItem('user');
    if (data) {
      // object to string
      console.log(data)
      const user_data = JSON.parse(data)
      const request: Request = {
        action: 'login',
        data: JSON.stringify({ "username": user_data.username, "token": user_data.token })
      };
      sendMessage(JSON.stringify(request));
      // ask current game
      const request_game: Request = {
        action: 'get_game',
        data: ''
      };
      sendMessage(JSON.stringify(request_game));
    }
  }

  const getHistory = () => {
    const request: Request = {
      action: 'game_history',
      data: ''
    };
    sendMessage(JSON.stringify(request));
  }



  const getEarnRecords = () => {
    const request: Request = {
      action: 'get_earn_records',
      data: ''
    };
    sendMessage(JSON.stringify(request));
  }

  const getTop = () => {
    const request: Request = {
      action: 'get_top',
      data: ''
    };
    sendMessage(JSON.stringify(request));
  }

  const playSound = () => {
    const audio = new Audio('/winning.wav');
    audio.play();
  }

  useEffect(() => {
    if (lastMessage !== null) {
      const response: Response = JSON.parse(lastMessage.data);
      if (response.action === 'login' && response.status === 'success') {
        // @ts-ignore
        setUser(response.data);
        setLogined(true);
      }
      if (response.action === 'register') {
        if (response.status === 'success') {
          console.log(response.data)
          // @ts-ignore
          setUser(response.data);
          // save to local storage
          localStorage.setItem('user', JSON.stringify(response.data));
          setLogined(true);
          console.log(response.data);
        }
        if (response.status === 'fail') {
          if (response.data === 'User already exists') {
            setRegisterMsg('使用者名稱已存在')
          } else {
            setRegisterMsg(response.data)
          }
        }
      }
      if (response.action === 'update_user') {
        // @ts-ignore
        setUser(response.data);
      }
      if (response.action === 'user_update') {
        // @ts-ignore
        setUser(response.data);
      }
      if (response.action === 'game_update') {
        // if change game, empty current bettings
        // @ts-ignore
        if (currentGame && currentGame.game_id !== response.data.game_id) {
          setCurrentBettings([]);
          setRestTime(8);
        }
        // @ts-ignore
        setCurrentGame(response.data);

      }
      if (response.action === 'bet') {
        if (response.status === 'fail') {
          setBettingResult({ state: 'fail', msg: response.data });
        } else {
          setBettingResult({ state: 'success', msg: "下注成功" });
          // @ts-ignore
          setCurrentBettings([...currentBettings, { nums: response.data.bet_nums, amount: response.data.amount }])
          console.log(currentBettings)
        }
      }
      if (response.action === 'earn_info') {
        setEarnInfos([...earnInfos, {
          // @ts-ignore
          game_id: response.data.game_id,
          // @ts-ignore
          game_nums: "[" + response.data.game_nums.join(', ') + "]",
          // @ts-ignore
          user_nums: "[" + response.data.user_nums.join(', ') + "]",
          // @ts-ignore
          bet_amount: response.data.bet_amount,
          // @ts-ignore
          earn_amount: response.data.earn_amount
        }]);
        // @ts-ignore
        if (response.data.earn_amount > response.data.bet_amount) {
          playSound();
        }

      }

      if (response.action === 'get_earn_records' && response.status === 'success') {
        // @ts-ignore
        setEarnInfos(response.data);
      }
      if (response.action === 'get_top' && response.status === 'success') {
        // @ts-ignore
        setTopUsers(response.data);
      }
      if (response.action === 'game_history' && response.status === 'success') {
        // @ts-ignore
        setGameHistory(response.data);
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    login();
    getEarnRecords();
    getTop();
    getHistory()
  }, []);

  useEffect(() => {
    if (restTime > 0) {
      const timerId = setInterval(() => {
        setRestTime((prevTime) => prevTime - 1);
      }, 1000); // 每秒减少1

      return () => clearInterval(timerId);
    }
  }, [restTime]);



  return (
    <>
      {!logined && <RegisterUi sendMessage={sendMessage} result={registerMsg} />}
      {logined && <div className="w-full flex space-x-3 bg-slate-950 h-screen">

        <div className="w-1/3 h-screen">
          {(logined && user) && <UserInfoView user={user} />}
          {(logined && topUsers) && <TopUserView topUsers={topUsers} />}
        </div>
        <div className="w-1/3 h-screen">
          {(logined && currentGame) && <GameView game={currentGame} />}
          {(logined && currentGame) && <BettingView sendMessage={sendMessage} gameState={currentGame.game_state} result={bettingResult} restTime={restTime} />}
          {(logined && currentBettings) && <CurrentBettingView bettings={currentBettings} />}
        </div>
        <div className="w-1/3 h-screen">
          {(logined && earnInfos) && <EarnInfoView earnInfos={earnInfos} />}
          {(logined && gameHistory) && <GameHistoryView gameHistory={gameHistory} />}
        </div>

      </div>}
    </>
  );
}

const RegisterUi: React.FC<{ sendMessage: SendMessage; result: string; }> = ({ sendMessage, result }) => {
  const usernameRef = useRef<HTMLInputElement>(null);

  const register = () => {
    const username = usernameRef.current?.value;
    if (username) {
      const request: Request = {
        action: 'register',
        data: JSON.stringify({ username: username }),
      };
      sendMessage(JSON.stringify(request));
    }
  }



  return (
    <div className="h-screen w-screen opacity-50% bg-gray-200 flex flex-col justify-center items-center">
      <h1 className="text-2xl font-bold text-center mt-10"
      >新使用者</h1>
      <input className="border border-gray-400 p-2 mt-2 w-1/2 text-center rounded-md"
        type="text" placeholder="輸入使用者名稱" ref={usernameRef} />
      <button className="border border-gray-400 p-2 mt-2  text-center rounded-md" onClick={register}>送出</button>
      <p className="text-red-500">{result}</p>

    </div>
  );
}

const UserInfoView = ({ user }: { user: User }) => {
  const recreateUser = () => {
    // clear local storage
    localStorage.removeItem('user');
    window.location.reload();
  }
  // string to date and add 8 hours 2024-06-20 13:26:17
  // parse to date
  let date = Date.parse(user.create_time);
  // add 8 hours
  date = date + 8 * 60 * 60 * 1000;

  return (
    <div className="w-full m-3 p-3 bg-slate-200 text-center space-y-3 rounded-md">
      <h1 className="text-2xl font-bold"
      >使用者資訊</h1>
      <p>使用者名稱: {user.username}</p>
      <p>餘額: {numToChinese(user.balance)}</p>
      {/* add 8 h */}
      <p>創建時間: {new Date(date).toLocaleString()}</p>
      <button className="border border-gray-400 p-2 mt-2  text-center rounded-md" onClick={recreateUser}>重新起號</button>
      <p className="text-red-500"
      >重建使用者將無法再次登入原使用者</p>
    </div>
  );
}

const GameView = ({ game }: { game: Game }) => {
  const stateMap: { [key: string]: string } = {
    '0': '下注中',
    '1': '開獎中',
    '2': '結算中',
  }
  return (
    <div className="w-full m-3 p-3 bg-slate-200 text-center space-y-3 rounded-md">
      <h1 className="text-2xl font-bold"
      >遊戲資訊</h1>
      <p>遊戲編號: {game.game_id}</p>
      <p>遊戲狀態: {stateMap[game.game_state]}</p>
    </div>
  );
}
interface BettingViewProps {
  sendMessage: SendMessage;
  gameState: string;
  result: betResult | null;
  restTime: number;
}
const BettingView = ({ sendMessage, gameState, result, restTime }: BettingViewProps) => {
  const [bet, setBet] = useState<number[]>([]);
  const amountRef = useRef<HTMLInputElement>(null);
  const randomBetCount = useRef<number>(0);
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  const selectNum = (num: number) => {
    let newBet = bet.filter((n) => n !== num);
    if (newBet.length === bet.length) {
      newBet.push(num);
    }
    if (newBet.length > 3) {
      newBet.shift();
    }

    setBet(newBet);
  }

  const is_num_in_selected = (num: number) => {
    return bet.includes(num);
  }

  const betting = () => {

    // amount 不得小於0
    if (Number(amountRef.current?.value) <= 0) {
      return;
    }
    const request: Request = {
      action: 'bet',
      data: JSON.stringify({ "nums": bet, "amount": Number(amountRef.current?.value) })
    };
    sendMessage(JSON.stringify(request));
    console.log(request);
  }


  return (
    <div className="w-full m-3 p-3 bg-slate-200 text-center space-y-3 rounded-md">

      <h1 className="text-2xl font-bold"
      >{"下注: " + String(restTime)}</h1>
      <p>選擇三個號碼下注</p>
      <div className="flex justify-center space-x-3">
        <input className={"border border-gray-400 p-2 mt-2 w-1/2 text-center rounded-md "} ref={amountRef} defaultValue={100}
          type="number" placeholder="下注金額" />
        <button className={"border border-gray-400 p-2 mt-2  text-center rounded-md" + (gameState != '0' ? ' bg-gray-400 text-white' : '')}
          disabled={gameState != '0'}
          onClick={betting}>下注</button>
      </div>
      <div className="space-x-1">
        {nums.map((num, index) => {
          return (
            <button key={index} className={"border border-gray-400 p-2 mt-2  text-center rounded-md " + (is_num_in_selected(num) ? 'bg-blue-500' : '')}
              onClick={() => {
                selectNum(num);
              }}
            >{num}</button>
          );
        })}
      </div>
      <p>已選號碼: {bet.filter((num) => num !== -1).join(' ')}</p>
      <p className={result?.state === 'fail' ? 'text-red-500' : 'text-green-500'}
      >{(result) ? result.msg : ""}</p>
    </div>
  );
}

const CurrentBettingView = ({ bettings }: { bettings: betting[] }) => {
  return (
    <div className="w-full m-3 p-3 bg-slate-200 text-center space-y-3 rounded-md">
      <h1 className="text-2xl font-bold"
      >下注紀錄</h1>
      {bettings.map((bet, index) => {
        return (
          <div key={index} className="flex justify-between">
            <p>下注號碼: {bet.nums.join(' ')}</p>
            <p>下注金額: {numToChinese(bet.amount)}</p>
          </div>
        );
        
      })}
    </div>
  );
}

const EarnInfoView = ({ earnInfos }: { earnInfos: earnInfo[] }) => {
  // game id 2024-06-20-1
  // game id 2024-06-20-432
  // 降序排列
  earnInfos = earnInfos.sort((a, b) => {
    return Number(b.game_id.split('-')[3]) - Number(a.game_id.split('-')[3]);
  })
  return (
    <div className="m-3 p-3 bg-slate-200 text-center space-y-3 rounded-md max-h-[50vh] overflow-y-auto p-5">
      <h1 className="text-2xl font-bold"
      >中獎紀錄</h1>
      <div className="flex w-full justify-center">
        <div className='overflow-x-auto w-full m-auto '>
          <table className='table-auto w-full'>
            <thead>
              <tr>
                <th>遊戲編號</th>
                <th>遊戲號碼</th>
                <th>使用者號碼</th>
                <th>下注金額</th>
                <th>中獎金額</th>
              </tr>
            </thead>
            <tbody>

              {earnInfos.map((info, index) => {
                return (
                  <tr key={index}>
                    <td>{info.game_id}</td>
                    <td>{info.game_nums}</td>
                    <td>{info.user_nums}</td>
                    <td>{numToChinese(info.bet_amount)}</td>
                    <td>{numToChinese(info.earn_amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const TopUserView = ({ topUsers }: { topUsers: topUser[] }) => {

  return (
    //use table
    <div className="m-3 w-full p-3 bg-slate-200 text-center space-y-3 rounded-md overflow-y-auto flex-grow h-[60vh]">
      <h1 className="text-2xl font-bold"
      >排行榜</h1>
      <div className="flex w-full">
        <div className='overflow-x-auto w-full '>
          <table className='table-auto w-full'>
            <thead>
              <tr>
                <th>排名</th>
                <th className="w-1/2"
                >使用者名稱</th>
                <th>餘額</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((user, index) => {
                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{user.username}</td>
                    <td>{numToChinese(user.balance)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const GameHistoryView = ({ gameHistory }: { gameHistory: gameHistory[] }) => {
  // table
  return (
    <div className="m-3 p-3 bg-slate-200 text-center space-y-3 rounded-md overflow-y-auto max-h-[45vh]">
      <h1 className="text-2xl font-bold"
      >遊戲紀錄</h1>
      <div className="flex w-full justify-center">
        <div className='overflow-x-auto w-full m-auto '>
          <table className='table-auto w-full'>
            <thead>
              <tr>
                <th>遊戲編號</th>
                <th>遊戲號碼</th>
              </tr>
            </thead>
            <tbody>
              {gameHistory.map((game, index) => {
                return (
                  <tr key={index}>
                    <td>{game.game_id}</td>
                    <td>{game.game_nums}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}