import React, {useState} from 'react'
import Calendar from 'react-calendar'
//import 'react-calendar/dist/Calendar.css';
import { isSameDay } from "date-fns";
import { CalendarInterface } from '../interfaces/ICalendar';
import {Card} from 'react-bootstrap'

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

const CalendarComponent = ({tokens}:CalendarInterface) =>{
    const [value, onChange] = useState<Value>(new Date());
    const highlightedDates = tokens?.map((ticket)=>new Date(ticket.eventDate));
    const tileContent = ({ date, view }: any) => {
      if (highlightedDates && view === 'month') {
        const matchingTokens = tokens?.filter((token) =>
          isSameDay(new Date(token.eventDate), date)
        );
    
        if (matchingTokens && matchingTokens.length > 0) {
          return (
            <div style={{ backgroundColor: '#6f48eb', color: 'white', padding: '5px' }}>
              {matchingTokens.map((token, index) => (
                <div key={index} style={{ marginBottom: '2px' }}>
                  {token.name || 'Unnamed Event'}
                </div>
              ))}
            </div>
          );
        }
      }
      return null;
    };
    
  return (
    <div>
        <Calendar onChange={onChange} value={value} tileContent={tileContent}/>
    </div>
  );

}

export default CalendarComponent;