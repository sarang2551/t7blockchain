import React, { useEffect } from "react";
import {useParams} from 'react-router-dom'

const EventView = ()=>{
    // query backend to get event data
    const { eventId } = useParams();

    useEffect(()=>{
        const eventData = fetch(`https://localhost:5000/{eventId}`)
    })
}

export default EventView;