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
        if (highlightedDates && view === 'month' && highlightedDates.some((highlightDate) => isSameDay(highlightDate, date))) {
          const matchingToken = tokens?.find((token) => isSameDay(new Date(token.eventDate),date));
          if (matchingToken) {
            return (
              <div style={{ backgroundColor: 'blue', color: 'white' }}>
                {matchingToken.name || 'Unnamed Event'}
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