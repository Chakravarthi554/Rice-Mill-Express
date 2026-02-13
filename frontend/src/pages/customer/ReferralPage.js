import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getReferrals, getReferralCode } from '../../redux/actions/userActions'; // Adjust if moved to referralActions
import { Container, Row, Col, Card, Button, ListGroup, Badge, InputGroup, FormControl, Spinner } from 'react-bootstrap';
import { FaUserPlus, FaCopy, FaShareAlt, FaUsers } from 'react-icons/fa';
import Message from '../../components/common/Message'; // Adjust path

const ReferralPage = () => {
    const dispatch = useDispatch();

    // Use userDetails or specific referral state depending on implementation
    // Assuming we updated referralReducer to store referrals in state.referrals
    // But currently userActions.js getReferrals doesn't dispatch to store completely yet? 
    // Wait, I updated userActions.js to return data but the Reducer might not be ready in frontend/src/redux/reducers/userReducers.js for the list? 
    // Actually, mobile used referralReducer. For desktop, let's use local state or ensure Redux is set.

    // NOTE: In mobile we made a new file. In desktop userActions.js `getReferrals` returns data.
    // Let's implement local state for simplicity or use the same logic if I port referralActions/Reducers.
    // To match Mobile, I should probably port `referralActions.js` and `referralReducers.js` to Desktop too?
    // UserActions:getReferrals in desktop currently just returns data. 
    // So I will use local state here for now.

    const [loading, setLoading] = React.useState(true);
    const [referralData, setReferralData] = React.useState({ code: '', stats: {}, referrals: [] });
    const [error, setError] = React.useState(null);

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    useEffect(() => {
        if (userInfo) {
            dispatch(getReferrals()).then((data) => {
                setReferralData(data);
                setLoading(false);
            }).catch((err) => {
                setError('Failed to load referrals');
                setLoading(false);
            });
        }
    }, [dispatch, userInfo]);

    const copyCode = () => {
        navigator.clipboard.writeText(referralData.code);
        alert('Referral code copied!');
    };

    return (
        <Container className="py-5">
            <h2 className="mb-4"><FaUserPlus className="me-2" /> Refer & Earn</h2>

            {loading ? <Spinner animation="border" /> : error ? <Message variant="danger">{error}</Message> : (
                <>
                    <Row className="mb-5 justify-content-center">
                        <Col md={8}>
                            <Card className="text-center shadow border-0" style={{ background: '#f8f9fa' }}>
                                <Card.Body className="p-5">
                                    <h3 className="mb-3 text-success">Invite Friends & Earn Rewards</h3>
                                    <p className="lead text-muted mb-4">Share your unique referral code with friends. When they make their first purchase, you both get reward points!</p>

                                    <div className="d-flex justify-content-center align-items-center mb-4">
                                        <div className="bg-white px-4 py-3 rounded border border-success d-flex align-items-center">
                                            <span className="h3 mb-0 me-3 fw-bold text-dark">{referralData?.code || 'LOADING...'}</span>
                                            <Button variant="outline-success" size="sm" onClick={copyCode}><FaCopy /> Copy</Button>
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-center gap-3">
                                        <Button variant="success" className="px-4 rounded-pill"><FaShareAlt className="me-2" /> Share Now</Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Card className="shadow-sm border-0">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0"><FaUsers className="me-2 text-primary" /> My Referrals ({referralData?.referrals?.length || 0})</h5>
                                </Card.Header>
                                <ListGroup variant="flush">
                                    {referralData?.referrals?.length > 0 ? referralData.referrals.map((ref, idx) => (
                                        <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <span className="fw-bold">{ref.name}</span>
                                                <div className="text-muted small">Joined: {new Date(ref.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <Badge bg={ref.isVerified ? 'success' : 'secondary'}>
                                                {ref.isVerified ? 'Verified' : 'Pending'}
                                            </Badge>
                                        </ListGroup.Item>
                                    )) : (
                                        <ListGroup.Item className="text-center py-4 text-muted">
                                            No referrals yet. Start inviting your friends!
                                        </ListGroup.Item>
                                    )}
                                </ListGroup>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
};

export default ReferralPage;
