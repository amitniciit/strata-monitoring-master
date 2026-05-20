import  { useEffect, useState } from 'react';
import axios from 'axios';
import './view.css'; // Import the CSS file
import {Link} from 'react-router-dom'
const View = () => {
    const [instruments, setInstrument] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInstrument();
    }, []);

    const fetchInstrument = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}`);
            console.log(data);
            setInstrument(data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <h1>Loading...</h1>;

    return (
        <>
            {instruments.length > 0 && instruments.map((instrumentDetail) => {
    return (
        <Link
            to={`${instrumentDetail.instrumentId}/graph`}
            key={instrumentDetail.instrumentId}
        >
            <div className="card">
                <div className="card-header">
                    Instrument ID: {instrumentDetail.instrumentId}
                </div>
                <div className="card-body">
                    <p><strong>Position:</strong> ({instrumentDetail.xCoordinate}, {instrumentDetail.yCoordinate})</p>
                    <p><strong>Description:</strong> {instrumentDetail.description}</p>
                    <p><strong>Instrument Code:</strong> {instrumentDetail.instrumentName}</p>
                </div>
            </div>
        </Link>
    );
})}

        </>
    );
};

export default View;

