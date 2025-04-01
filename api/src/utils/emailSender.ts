import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 创建邮件发送器
 */
const createTransporter = async () => {
  // 从环境变量获取SMTP配置
  const host = process.env.SMTP_HOST || 'smtp.example.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER || 'user@example.com';
  const pass = process.env.SMTP_PASS || 'password';
  const fromEmail = process.env.SMTP_FROM || 'noreply@aiops.example.com';
  
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465端口使用SSL
    auth: {
      user,
      pass,
    },
    tls: {
      // 不验证证书（开发环境可用，生产环境建议设为true）
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
  
  return {
    transporter,
    fromEmail,
  };
};

/**
 * 发送邮件
 * @param subject 邮件标题
 * @param content 邮件内容
 * @param to 收件人
 * @param isHtml 是否为HTML内容
 * @returns 发送结果
 */
export async function sendEmail(
  subject: string,
  content: string,
  to: string | string[],
  isHtml = false
): Promise<boolean> {
  try {
    // 创建发送器
    const { transporter, fromEmail } = await createTransporter();
    
    // 准备邮件内容
    const mailOptions = {
      from: fromEmail,
      to: Array.isArray(to) ? to.join(',') : to,
      subject: `[AIOps平台] ${subject}`,
      ...(isHtml ? { html: content } : { text: content }),
    };
    
    // 发送邮件
    const info = await transporter.sendMail(mailOptions);
    console.log(`邮件已发送: ${info.messageId}`);
    
    return true;
  } catch (error) {
    console.error('发送邮件失败:', error);
    
    // 开发环境下在控制台模拟邮件内容
    if (process.env.NODE_ENV !== 'production') {
      console.log('=====================');
      console.log('模拟邮件内容:');
      console.log(`收件人: ${Array.isArray(to) ? to.join(',') : to}`);
      console.log(`标题: [AIOps平台] ${subject}`);
      console.log(`内容: ${content}`);
      console.log('=====================');
    }
    
    return false;
  }
} 