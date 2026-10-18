import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Space, message } from 'antd';
import { GetSettings, SaveSettings, SelectFile, SelectFFmpeg } from '../wailsjs/go/main/App';
import { EventsEmit } from '../wailsjs/runtime/runtime';

export default function SettingsPage() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [msg, holder] = message.useMessage();

    // 进入页面时读取本地配置
    useEffect(() => {
        GetSettings()
            .then((s) => form.setFieldsValue({
                ytdlpPath: s.ytdlpPath,
                ffmpegPath: s.ffmpegPath,
            }))
            .catch((err) => console.error('读取设置失败:', err));
    }, [form]);

    const browseYtdlp = async () => {
        const path = await SelectFile();
        if (path) form.setFieldValue('ytdlpPath', path);
    };

    const browseFfmpeg = async () => {
        const path = await SelectFFmpeg();
        if (path) form.setFieldValue('ffmpegPath', path);
    };

    const save = async () => {
        const values = await form.validateFields();
        await SaveSettings({
            ytdlpPath: values.ytdlpPath,
            ffmpegPath: values.ffmpegPath,
        });
        EventsEmit('settings-changed');
        msg.success('已保存');
    };

    return (
        <div className="page">
            {holder}
            <Form form={form} layout="horizontal" colon={false} labelCol={{ flex: '100px' }}>
                <Form.Item label="yt-dlp 路径" name="ytdlpPath">
                    <Input
                        placeholder="点击选择或手动填写"
                        addonAfter={<a onClick={browseYtdlp}>浏览</a>}
                    />
                </Form.Item>
                <Form.Item label="ffmpeg 路径" name="ffmpegPath">
                    <Input
                        placeholder="点击选择或手动填写（时段截取需要）"
                        addonAfter={<a onClick={browseFfmpeg}>浏览</a>}
                    />
                </Form.Item>
                <Form.Item label=" ">
                    <Space>
                        <Button type="primary" onClick={save}>保存</Button>
                        <Button onClick={() => navigate('/')}>返回首页</Button>
                    </Space>
                </Form.Item>
            </Form>
        </div>
    );
}
