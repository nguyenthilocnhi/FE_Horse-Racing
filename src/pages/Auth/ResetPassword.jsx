import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as authService from '../../services/authService'

export default function ResetPassword() {
    const [step, setStep] = useState(1) // 1: Email, 2: Verification & New Password
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const navigate = useNavigate()

    async function handleSendCode(e) {
        e.preventDefault()
        if (!email) {
            setError('Vui lòng nhập địa chỉ email.')
            return
        }

        setError('')
        setLoading(true)

        try {
            const res = await authService.forgotPassword(email);
            setStep(2)
            setSuccess(res.message || 'Mã xác minh (OTP) đã được gửi tới email của bạn.')
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    async function handleResetPassword(e) {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!code) {
            setError('Vui lòng nhập mã xác minh.')
            return
        }
        if (password.length < 6) {
            setError('Mật khẩu mới phải từ 6 ký tự trở lên.')
            return
        }
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không trùng khớp.')
            return
        }

        setLoading(true)

        try {
            const res = await authService.resetPassword({
                email,
                otp: code,
                newPassword: password,
                confirmPassword
            })
            setSuccess(res.message || 'Chúc mừng! Đặt lại mật khẩu thành công. Đang chuyển hướng đăng nhập...')
            setTimeout(() => {
                navigate('/login')
            }, 2000)
        } catch (err) {
            setError(err.response?.data?.message || 'Mã xác minh không chính xác hoặc có lỗi xảy ra.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-shell">
            <div className="auth-panel auth-image-panel">
                <img
                    src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=80"
                    alt="Ngựa đang phi"
                />
                <div className="auth-image-overlay">
                    <span className="hero-label">HORSIE</span>
                    <h2>Khôi phục tài khoản của bạn</h2>
                    <p>Lấy lại mật khẩu để tiếp tục theo dõi các vòng đua kịch tính.</p>
                </div>
            </div>

            <div className="auth-panel auth-admin">
                <div className="auth-panel-head">
                    <span className="hero-label">Quên mật khẩu</span>
                    <h2>Đặt lại mật khẩu</h2>
                    <p>
                        {step === 1
                            ? 'Vui lòng cung cấp email đăng ký để nhận mã khôi phục.'
                            : 'Nhập mã xác minh từ email và tạo mật khẩu mới.'}
                    </p>
                </div>

                {error && <p className="auth-error" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
                {success && <p className="auth-success" style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{success}</p>}

                {step === 1 ? (
                    <form onSubmit={handleSendCode}>
                        <div className="form-group" style={{ marginBottom: '18px' }}>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Địa chỉ Email"
                                className="input-field"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Đang gửi mã...' : 'Gửi mã xác minh'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <div className="form-group" style={{ marginBottom: '14px' }}>
                            <input
                                required
                                type="text"
                                maxLength="6"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder="Mã OTP (6 chữ số)"
                                className="input-field"
                                style={{ width: '100%', letterSpacing: '0.1em', textAlign: 'center', fontWeight: 'bold' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '14px' }}>
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                                className="input-field"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <input
                                required
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Xác nhận mật khẩu mới"
                                className="input-field"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Đang đặt lại mật khẩu...' : 'Cập nhật mật khẩu'}
                        </button>
                    </form>
                )}

                {step === 1 && (
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingLeft: '32px', paddingRight: '32px' }}>
                        <Link to="/login" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: '500' }}>
                            Đăng nhập
                        </Link>
                        <Link to="/" style={{ color: '#aaa', textDecoration: 'none' }}>
                            Quay về trang chủ →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
