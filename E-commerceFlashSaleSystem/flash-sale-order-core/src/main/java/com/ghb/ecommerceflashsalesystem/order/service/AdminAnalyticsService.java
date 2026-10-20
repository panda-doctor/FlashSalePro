package com.ghb.ecommerceflashsalesystem.order.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ghb.ecommerceflashsalesystem.analytics.mapper.SeckillActivitySnapshotMapper;
import com.ghb.ecommerceflashsalesystem.domain.entity.SeckillActivitySnapshot;
import com.ghb.ecommerceflashsalesystem.domain.entity.SeckillMessageLog;
import com.ghb.ecommerceflashsalesystem.order.dto.analytic.ActivityOrderAggRow;
import com.ghb.ecommerceflashsalesystem.order.dto.analytic.DailyTrendRow;
import com.ghb.ecommerceflashsalesystem.order.dto.analytic.OrderTotalsRow;
import com.ghb.ecommerceflashsalesystem.order.mapper.SeckillMessageLogMapper;
import com.ghb.ecommerceflashsalesystem.order.mapper.SeckillOrderMapper;
import com.ghb.ecommerceflashsalesystem.order.vo.AdminOverviewVO;
import com.ghb.ecommerceflashsalesystem.order.vo.SnapshotPointVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 管理端经营看板：聚合 order 权威库中的订单、消息日志与快照，全部单库查询，不跨服务调用。
 */
@Service
@RequiredArgsConstructor
public class AdminAnalyticsService {

    private static final int MAX_TREND_DAYS = 30;
    private static final int MAX_SNAPSHOT_LIMIT = 100;
    private static final int STATUS_DEAD = 3;

    private final SeckillOrderMapper seckillOrderMapper;
    private final SeckillMessageLogMapper messageLogMapper;
    private final SeckillActivitySnapshotMapper snapshotMapper;

    public AdminOverviewVO overview(int days) {
        int window = Math.min(MAX_TREND_DAYS, Math.max(1, days));
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime trendStart = today.minusDays(window - 1L).atStartOfDay();

        OrderTotalsRow totals = seckillOrderMapper.selectOrderTotals(todayStart);
        AdminOverviewVO.Summary summary = new AdminOverviewVO.Summary();
        if (totals != null) {
            summary.setOrderCount(totals.getOrderCount());
            summary.setGmv(totals.getGmv());
            summary.setUserCount(totals.getUserCount());
            summary.setTodayOrderCount(totals.getTodayOrderCount());
            summary.setTodayGmv(totals.getTodayGmv());
        }
        Long deadLetters = messageLogMapper.selectCount(
                new LambdaQueryWrapper<SeckillMessageLog>().eq(SeckillMessageLog::getStatus, STATUS_DEAD));
        summary.setDeadLetterCount(deadLetters == null ? 0 : deadLetters);

        AdminOverviewVO overview = new AdminOverviewVO();
        overview.setSummary(summary);
        overview.setTrend(buildTrend(today, window, seckillOrderMapper.selectDailyTrend(trendStart)));
        overview.setTopActivities(buildTopActivities(seckillOrderMapper.selectTopActivities()));
        return overview;
    }

    public List<SnapshotPointVO> snapshots(Long activityId, int limit) {
        int size = Math.min(MAX_SNAPSHOT_LIMIT, Math.max(1, limit));
        List<SeckillActivitySnapshot> rows = snapshotMapper.selectList(
                new LambdaQueryWrapper<SeckillActivitySnapshot>()
                        .eq(SeckillActivitySnapshot::getActivityId, activityId)
                        .orderByDesc(SeckillActivitySnapshot::getSnapshotTime)
                        .last("LIMIT " + size));
        return rows.stream().map(SnapshotPointVO::of).toList();
    }

    /**
     * 补齐没有订单的日期，保证 TrendChart 的横轴连续。
     */
    private List<AdminOverviewVO.TrendPoint> buildTrend(LocalDate today, int window, List<DailyTrendRow> rows) {
        Map<String, DailyTrendRow> byDay = new HashMap<>();
        if (rows != null) {
            for (DailyTrendRow row : rows) {
                byDay.put(row.getDay(), row);
            }
        }
        List<AdminOverviewVO.TrendPoint> trend = new ArrayList<>(window);
        for (int offset = window - 1; offset >= 0; offset--) {
            String day = today.minusDays(offset).toString();
            DailyTrendRow row = byDay.get(day);
            trend.add(new AdminOverviewVO.TrendPoint(day,
                    row == null ? 0 : row.getOrderCount(),
                    row == null ? 0 : row.getGmv()));
        }
        return trend;
    }

    private List<AdminOverviewVO.TopActivity> buildTopActivities(List<ActivityOrderAggRow> rows) {
        if (rows == null) {
            return List.of();
        }
        return rows.stream()
                .map(row -> new AdminOverviewVO.TopActivity(row.getActivityId(), row.getOrderCount(), row.getGmv()))
                .toList();
    }
}
