import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getRewards, getRewardTransactions, getActiveCampaigns, redeemReward } from '../../redux/actions/rewardsActions';
import { Container, Row, Col, Card, Button, ListGroup, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaStar, FaHistory, FaGift, FaExchangeAlt } from 'react-icons/fa';
import Message from '../../components/common/Message'; // Adjust path if needed

const RewardsPage = () => {
    const dispatch = useDispatch();

    const rewardsState = useSelector((state) => state.rewards);
    const { loading: rewardsLoading, rewards, error: rewardsError } = rewardsState;

    const transactionsState = useSelector((state) => state.rewardTransactions);
    const { loading: transLoading, transactions, error: transError } = transactionsState;

    const campaignsState = useSelector((state) => state.campaigns);
    const { loading: campaignsLoading, campaigns, error: campaignsError } = campaignsState;

    const redeemState = useSelector((state) => state.redeemReward);
    const { loading: redeemLoading, success: redeemSuccess, error: redeemError } = redeemState;

    useEffect(() => {
        dispatch(getRewards());
        dispatch(getRewardTransactions());
        dispatch(getActiveCampaigns());
    }, [dispatch]);

    const handleRedeem = () => {
        if (window.confirm('Are you sure you want to redeem 100 points?')) {
            dispatch(redeemReward(100)); // Example amount
        }
    };

    return (
        <Container className="py-5">
            <h2 className="mb-4"><FaGift className="me-2" /> My Rewards</h2>

            {redeemSuccess && <Message variant="success">Reward redeemed successfully!</Message>}
            {redeemError && <Message variant="danger">{redeemError}</Message>}

            <Row className="mb-4">
                <Col md={4} className="mb-3">
                    <Card className="text-center shadow-sm border-0 h-100" style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)', color: 'white' }}>
                        <Card.Body className="d-flex flex-column justify-content-center">
                            <FaStar size={40} className="mb-3 mx-auto" />
                            <h3 className="display-4 fw-bold">{rewards?.points || 0}</h3>
                            <p className="lead">Available Points</p>
                            <Button variant="light" className="mt-3 rounded-pill fw-bold text-success" onClick={handleRedeem} disabled={redeemLoading || (rewards?.points || 0) < 100}>
                                {redeemLoading ? 'Redeeming...' : 'Redeem Points'}
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={8}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Header className="bg-white border-bottom-0">
                            <h5 className="mb-0 fw-bold"><FaExchangeAlt className="me-2 text-primary" /> Recent Transactions</h5>
                        </Card.Header>
                        <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {transLoading ? <Spinner animation="border" /> : transError ? <Message variant="danger">{transError}</Message> : (
                                <ListGroup variant="flush">
                                    {transactions && transactions.length > 0 ? transactions.map((t) => (
                                        <ListGroup.Item key={t._id} className="d-flex justify-content-between align-items-center border-0 px-0">
                                            <div>
                                                <div className="fw-bold">{t.description || 'Order Reward'}</div>
                                                <small className="text-muted">{new Date(t.createdAt).toLocaleDateString()}</small>
                                            </div>
                                            <Badge bg={t.type === 'credit' ? 'success' : 'danger'} pill>
                                                {t.type === 'credit' ? '+' : '-'}{t.points}
                                            </Badge>
                                        </ListGroup.Item>
                                    )) : <p className="text-muted">No transactions yet.</p>}
                                </ListGroup>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <h4 className="mb-3">Active Campaigns</h4>
            {campaignsLoading ? <Spinner animation="border" /> : campaignsError ? <Message variant="danger">{campaignsError}</Message> : (
                <Row>
                    {campaigns && campaigns.length > 0 ? campaigns.map(c => (
                        <Col md={4} key={c._id} className="mb-3">
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Img variant="top" src={c.img || 'https://via.placeholder.com/300x150'} style={{ height: '150px', objectFit: 'cover' }} />
                                <Card.Body>
                                    <Card.Title>{c.title}</Card.Title>
                                    <Card.Text className="text-muted small">{c.description}</Card.Text>
                                    <Badge bg="warning" text="dark">
                                        {c.valueType === 'multiplier' ? `${c.value}x Points` : `${c.value} Points`}
                                    </Badge>
                                </Card.Body>
                                <Card.Footer className="bg-white border-top-0 text-muted small">
                                    Valid until: {new Date(c.endDate).toLocaleDateString()}
                                </Card.Footer>
                            </Card>
                        </Col>
                    )) : <Col><Alert variant="info">No active campaigns at the moment.</Alert></Col>}
                </Row>
            )}
        </Container>
    );
};

export default RewardsPage;
