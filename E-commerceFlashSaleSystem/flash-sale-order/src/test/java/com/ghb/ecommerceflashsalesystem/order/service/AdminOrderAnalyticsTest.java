package com.ghb.ecommerceflashsalesystem.order.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ghb.ecommerceflashsalesystem.analytics.mapper.SeckillActivitySnapshotMapper;
import com.ghb.ecommerceflashsalesystem.common.api.PageResponse;
import com.ghb.ecommerceflashsalesystem.common.exception.BusinessException;
import com.ghb.ecommerceflashsalesystem.domain.entity.SeckillActivitySnapshot;
import com.ghb.ecommerceflashsalesystem.domain.entity.SeckillMessageLog;
import com.ghb.ecommerceflashsalesystem.domain.entity.SeckillOrder;
import com.ghb.ecommerceflashsalesystem.domain.enums.OrderStatusEnum;
import com.ghb.ecommerceflashsalesystem.order.dto.analytic.ActivityOrderAggRow;
import com.ghb.ecommerceflashsalesystem.order.dto.analytic.DailyTrendRow;
import com.ghb.ecommerceflashsalesystem.order.dto.analytic.OrderTotalsRow;
import com.ghb.ecommerceflashsalesystem.order.mapper.SeckillMessageLogMapper;
import com.ghb.ecommerceflashsalesystem.order.mapper.SeckillOrderMapper;
import com.ghb.ecommerceflashsalesystem.order.vo.AdminOrderVO;
import com.ghb.ecommerceflashsalesystem.order.vo.AdminOverviewVO;
import com.ghb.ecommerceflashsalesystem.order.vo.DeadLetterItemVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * 管理端订单/死信/看板：分页映射、状态解析、趋势补零与异常语义。
 */
@ExtendWith(MockitoExtension.class)
class AdminOrderAnalyticsTest {

    @Mock
    private SeckillOrderMapper seckillOrderMapper;

    @Mock
    private SeckillMessageLogMapper messageLogMapper;

    @Mock
    private SeckillActivitySnapshotMapper snapshotMapper;

    private AdminOrderQueryService orderQueryService;
    private AdminDeadLetterQueryService deadLetterQueryService;
    private AdminAnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        orderQueryService = new AdminOrderQueryService(seckillOrderMapper);
        deadLetterQueryService = new AdminDeadLetterQueryService(messageLogMapper);
        analyticsService = new AdminAnalyticsService(seckillOrderMapper, messageLogMapper, snapshotMapper);
    }

    @Test
    @DisplayName("订单分页输出管理端字段与状态描述")
    void pageOrdersMapsFields() {
        SeckillOrder order = new SeckillOrder();
        order.setId(1L);
        order.setOrderNo("SK20261020001");
        order.setActivityId(9L);
        order.setProductId(8L);
        order.setUserId(7L);
        order.setSeckillPrice(199L);
        order.setStatus(OrderStatusEnum.CREATED.getCode());
        order.setFailureReason(null);

        Page<SeckillOrder> dbPage = new Page<>(1, 20);
        dbPage.setRecords(List.of(order));
        dbPage.setTotal(1);
        when(seckillOrderMapper.selectPage(any(Page.class), any())).thenReturn(dbPage);

        PageResponse<AdminOrderVO> result =
                orderQueryService.pageOrders(1, 20, "SK20261020001", 9L, 7L, "CREATED");

        assertThat(result.getTotal()).isEqualTo(1);
        AdminOrderVO vo = result.getRecords().get(0);
        assertThat(vo.getOrderNo()).isEqualTo("SK20261020001");
        assertThat(vo.getStatus()).isEqualTo("CREATED");
        assertThat(vo.getStatusDesc()).isEqualTo("已创建");
        assertThat(vo.getUserId()).isEqualTo(7L);
        assertThat(vo.getSeckillPrice()).isEqualTo(199L);
    }

    @Test
    @DisplayName("非法订单状态按参数错误拒绝")
    void invalidOrderStatusRejected() {
        assertThatThrownBy(() -> orderQueryService.pageOrders(1, 20, null, null, null, "DONE"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("无效的订单状态");
    }

    @Test
    @DisplayName("订单不存在返回 NOT_FOUND")
    void missingOrderRejected() {
        when(seckillOrderMapper.selectByOrderNo("SK404")).thenReturn(null);

        assertThatThrownBy(() -> orderQueryService.getOrder("SK404"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("订单不存在");
    }

    @Test
    @DisplayName("死信分页只查 status=3 并映射失败信息")
    void pageDeadLettersMapsFields() {
        SeckillMessageLog log = new SeckillMessageLog();
        log.setStreamMessageId("1700000000000-0");
        log.setOrderNo("SK20261020002");
        log.setActivityId(9L);
        log.setRetryCount(3);
        log.setStatus(3);
        log.setErrorMessage("库存回补失败");

        Page<SeckillMessageLog> dbPage = new Page<>(1, 20);
        dbPage.setRecords(List.of(log));
        dbPage.setTotal(1);
        when(messageLogMapper.selectPage(any(Page.class), any())).thenReturn(dbPage);

        PageResponse<DeadLetterItemVO> result =
                deadLetterQueryService.pageDeadLetters(1, 20, "SK2026", 9L);

        assertThat(result.getTotal()).isEqualTo(1);
        DeadLetterItemVO vo = result.getRecords().get(0);
        assertThat(vo.getStreamMessageId()).isEqualTo("1700000000000-0");
        assertThat(vo.getRetryCount()).isEqualTo(3);
        assertThat(vo.getErrorMessage()).isEqualTo("库存回补失败");
    }

    @Test
    @DisplayName("看板趋势补齐空缺日期，汇总与 Top 活动来自聚合结果")
    void overviewFillsMissingDays() {
        OrderTotalsRow totals = new OrderTotalsRow();
        totals.setOrderCount(10);
        totals.setGmv(1000);
        totals.setUserCount(5);
        totals.setTodayOrderCount(2);
        totals.setTodayGmv(200);
        when(seckillOrderMapper.selectOrderTotals(any())).thenReturn(totals);

        DailyTrendRow today = new DailyTrendRow();
        today.setDay(LocalDate.now().toString());
        today.setOrderCount(2);
        today.setGmv(200);
        when(seckillOrderMapper.selectDailyTrend(any())).thenReturn(List.of(today));

        ActivityOrderAggRow top = new ActivityOrderAggRow();
        top.setActivityId(9L);
        top.setOrderCount(6);
        top.setGmv(600);
        when(seckillOrderMapper.selectTopActivities()).thenReturn(List.of(top));
        when(messageLogMapper.selectCount(any())).thenReturn(4L);

        AdminOverviewVO overview = analyticsService.overview(7);

        assertThat(overview.getSummary().getOrderCount()).isEqualTo(10);
        assertThat(overview.getSummary().getDeadLetterCount()).isEqualTo(4);
        assertThat(overview.getTrend()).hasSize(7);
        assertThat(overview.getTrend().get(0).getDate())
                .isEqualTo(LocalDate.now().minusDays(6).toString());
        assertThat(overview.getTrend().get(0).getOrderCount()).isZero();
        assertThat(overview.getTrend().get(6).getOrderCount()).isEqualTo(2);
        assertThat(overview.getTopActivities()).hasSize(1);
        assertThat(overview.getTopActivities().get(0).getActivityId()).isEqualTo(9L);
    }

    @Test
    @DisplayName("快照趋势按时间倒序映射")
    void snapshotsMapped() {
        SeckillActivitySnapshot snapshot = new SeckillActivitySnapshot();
        snapshot.setActivityId(9L);
        snapshot.setRedisStock(3);
        snapshot.setOrderCount(7L);
        snapshot.setSnapshotTime(LocalDateTime.of(2026, 10, 20, 10, 0));
        when(snapshotMapper.selectList(any())).thenReturn(List.of(snapshot));

        var points = analyticsService.snapshots(9L, 20);

        assertThat(points).hasSize(1);
        assertThat(points.get(0).getRedisStock()).isEqualTo(3);
        assertThat(points.get(0).getOrderCount()).isEqualTo(7L);
    }
}
