package com.ghb.ecommerceflashsalesystem.order.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ghb.ecommerceflashsalesystem.common.api.PageResponse;
import com.ghb.ecommerceflashsalesystem.domain.entity.SeckillMessageLog;
import com.ghb.ecommerceflashsalesystem.order.mapper.SeckillMessageLogMapper;
import com.ghb.ecommerceflashsalesystem.order.vo.DeadLetterItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 死信列表查询：只读 {@code seckill_message_log}（status=3）。
 *
 * <p>与重放职责分离：列表用于定位与勾选，重放仍由 {@link DeadLetterReplayService}
 * 从死信流取完整消息体（库里没有成交价/请求时间，不能凭日志重建消息）。</p>
 */
@Service
@RequiredArgsConstructor
public class AdminDeadLetterQueryService {

    /** 消息日志状态：3=死信（与 MessageLogStatusEnum 一致）。 */
    private static final int STATUS_DEAD = 3;

    private final SeckillMessageLogMapper messageLogMapper;

    public PageResponse<DeadLetterItemVO> pageDeadLetters(long page, long pageSize,
                                                          String keyword, Long activityId) {
        LambdaQueryWrapper<SeckillMessageLog> query = new LambdaQueryWrapper<>();
        query.eq(SeckillMessageLog::getStatus, STATUS_DEAD);
        if (activityId != null) {
            query.eq(SeckillMessageLog::getActivityId, activityId);
        }
        if (keyword != null && !keyword.isBlank()) {
            String term = keyword.trim();
            query.and(wrapper -> wrapper.like(SeckillMessageLog::getOrderNo, term)
                    .or()
                    .like(SeckillMessageLog::getStreamMessageId, term));
        }
        // 同一毫秒可能多条，追加 id 保证翻页稳定
        query.orderByDesc(SeckillMessageLog::getUpdatedAt).orderByDesc(SeckillMessageLog::getId);

        Page<SeckillMessageLog> result = messageLogMapper.selectPage(new Page<>(page, pageSize), query);
        List<DeadLetterItemVO> records = result.getRecords().stream().map(DeadLetterItemVO::of).toList();
        return new PageResponse<>(records, result.getCurrent(), result.getSize(),
                result.getTotal(), result.getPages());
    }
}
