import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../api/client';
import { useUi } from '../context/UiContext';

// Starts a test on the server and opens the runner.
export function useStartTest() {
    const navigate = useNavigate();
    const { toast } = useUi();
    const [starting, setStarting] = useState(null);

    const start = async (spec, key = spec.mode) => {
        setStarting(key);
        try {
            const d = await post('/tests/start', spec);
            navigate(`/test/${d.attempt.id}`);
        } catch (e) {
            toast(e.message, 'error');
            setStarting(null);
        }
    };

    return { start, starting };
}
